require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const queueManager = require('./utils/queueManager');
const browserService = require('./services/browserService');
const videoService = require('./services/videoService');
const FileUtils = require('./utils/fileUtils');
const {
  PAGE_LOAD_TIMEOUT,
  M3U8_DETECTION_TIMEOUT,
  DYNAMIC_CONTENT_WAIT,
  MAX_FILE_SIZE_MB,
} = require('./config/constants');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let isProcessingQueue = false; // Global flag to track queue processing

async function processLink(link, retries = 2) {
  let page = null;
  try {
    page = await browserService.createPage();
    await page.setRequestInterception(true);

    let m3u8Url = null;
    const reqHeaders = {
      Accept: '*/*',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
      Connection: 'keep-alive',
      Cookie:
        'ndus=YvtR13xteHuirAQalRWt55IhH2GZQu6UtqbDJEmy; csrfToken=9RWW1OmUG1oLmGs2D3K6-atx; TSID=oRWn6OXtTLCADzChGmDO7YWgS7mo9l22; __bid_n=18e5beb91436a995404207; _ga=GA1.1.1388610714.1718257521; lang=en; ab_ymg_result={"data":"f1e6ead76e6b538beca625e2d04f8b378e0d631fa69c94c213db2cf60164038cb4c0b56528c501edc038b78006fc4bb7984dcfc991e2386a5b44d0a9a4c8803fd7192df89d2e4f20dbe92a0c85ba1a4a3626d80718990bb5346f975a84f41b48c4e58839ed6d3441cfaa7adaf757830ad174fccef4c0ffaabb3cb296154044f3","key_id":"66","sign":"e073219a"}; ab_sr=1.0.1_Njc4ZTVlN2Y4YTU1YzFlZjg0NWIzMzdjODE0ZTc1OTBjZDljZDBlYWI4ZjI1NDcxMzFlMzg4MDE3YmY2MjgzZWVlOGVjMDc0MWJjM2UzZTk0YzBiYzM1MzBjYWI0MDEwNDIxZGY5N2QyYTM4MDAzMzQ3NjdkMDBkNzRjYmY0YzViOGExNGE1ZjdkOGNiYmNmOTQ3Njg3M2YzMzE2MGQ0Yw==; browserid=qdvnhjlwgSwicAEOamUOJhLp_aBWFxqPaeM1iUT3MlwHQ7zK0gMor_gabjg=; _ga_06ZNKL8C2E=deleted; _ga_06ZNKL8C2E=deleted; _ga_06ZNKL8C2E=GS1.1.1737470058.3.1.1737470070.48.0.0; __stripe_mid=342701df-4620-400d-aee4-e21e7c61e2c2416287; __stripe_sid=b457efda-cf64-4ea7-8715-1a659fd3c3edd402d4; ndut_fmt=EE9AAC50D7AACE5F1CC5EAB09C1CBF26ECA2A7E318C5E461F3FBEB037FECAF44',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
      'sec-ch-ua':
        '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
    };

    const m3u8Promise = new Promise((resolve) => {
      page.on('request', (request) => {
        const url = request.url();
        if (url.includes('M3U8') || url.includes('playlist')) {
          console.log('Found HLS stream request:', url);
          m3u8Url = url;
          // reqHeaders = request.headers();
          resolve(m3u8Url);
        }
        request.continue();
      });
    });

    await page.goto(link, {
      waitUntil: 'networkidle2',
      timeout: PAGE_LOAD_TIMEOUT,
    });
    await new Promise((resolve) => setTimeout(resolve, DYNAMIC_CONTENT_WAIT));
    await Promise.race([
      m3u8Promise,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('M3U8 timeout')),
          M3U8_DETECTION_TIMEOUT
        )
      ),
    ]);

    if (!m3u8Url) {
      throw new Error('No m3u8 URL found');
    }

    const title = await page.title();
    const outputFilePath = await videoService.downloadAndMergeVideo(
      m3u8Url,
      reqHeaders,
      title
    );
    return outputFilePath;
  } catch (error) {
    console.error(`Error in processLink (attempt ${3 - retries}/3):`, error);
    if (
      error.message.includes('Protocol error') ||
      error.message.includes('Connection closed')
    ) {
      await browserService.resetBrowser();
      if (retries > 0) {
        console.log(`Retrying processLink, ${retries} attempts remaining...`);
        return processLink(link, retries - 1);
      }
    }
    throw error;
  } finally {
    if (page) {
      await browserService.closePage(page);
    }
  }
}

async function processQueueBatch() {
  if (
    isProcessingQueue ||
    queueManager.isProcessing ||
    !queueManager.hasItems()
  )
    return;

  try {
    isProcessingQueue = true;
    queueManager.setProcessing(true);
    const batch = queueManager.getNextBatch();

    // If no batch to process, reset and return
    if (!batch || batch.length === 0) {
      queueManager.setProcessing(false);
      isProcessingQueue = false;
      return;
    }

    // Notify which items are being processed
    for (const { url, channelId, queuePosition } of batch) {
      try {
        const channel = await client.channels.fetch(channelId);
        await channel.send(`Processing URL at position ${queuePosition}...`);
      } catch (error) {
        console.error(`Error sending processing notification: ${error}`);
      }
    }

    const processPromises = batch.map(
      async ({ url, channelId, queuePosition }) => {
        try {
          const channel = await client.channels.fetch(channelId);
          const outputFilePath = await processLink(url);

          const { size, exceeds } = FileUtils.checkFileSize(outputFilePath);
          if (exceeds) {
            await channel.send(
              `Warning: Video was trimmed to ${MAX_FILE_SIZE_MB}MB size limit. Sending partial video...`
            );
          }
          await channel.send({ files: [outputFilePath] });
          await FileUtils.deleteFile(outputFilePath);
          return url;
        } catch (error) {
          console.error(`Error processing URL ${url}:`, error);
          const channel = await client.channels.fetch(channelId);
          await channel.send(`Error processing: ${error.message}`);
          return url;
        }
      }
    );

    try {
      const processedUrls = await Promise.all(processPromises);
      queueManager.removeFromQueueFile(processedUrls);
    } catch (error) {
      console.error('Error in batch processing:', error);
    }
  } finally {
    queueManager.setProcessing(false);
    isProcessingQueue = false;

    // Schedule next batch processing with a small delay
    if (queueManager.hasItems()) {
      setTimeout(() => processQueueBatch(), 1000);
    }
  }
}

client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  // Ensure browser is properly initialized before processing queue
  await browserService.resetBrowser();
  queueManager.loadQueueFromFile();
  processQueueBatch();
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith('!s')) return;

  const args = message.content.split(' ');
  if (args.length < 2) {
    const reply = await message.reply(
      'Please provide a URL. Usage: `!s <url>`'
    );
    setTimeout(async () => {
      try {
        await message.delete();
        await reply.delete();
      } catch (error) {
        console.error('Error deleting messages:', error);
      }
    }, 5000);
    return;
  }

  const url = args[1];
  try {
    const queuePosition = queueManager.addToQueue(url, message.channel.id);
    const totalInQueue = queueManager.getCurrentQueueLength();
    const reply = await message.reply(
      `Added URL to queue at position ${queuePosition}. Total URLs in queue: ${totalInQueue}`
    );

    try {
      await message.delete();
    } catch (error) {
      console.error('Error deleting command message:', error);
    }

    processQueueBatch();
  } catch (error) {
    console.error('Error adding URL to queue:', error);
    await message.channel.send(`Error adding URL to queue: ${error.message}`);
    try {
      await message.delete();
    } catch (deleteError) {
      console.error('Error deleting command message after error:', deleteError);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

// Add cleanup on process exit
process.on('SIGINT', async () => {
  console.log('Cleaning up before exit...');
  await browserService.cleanup();
  process.exit();
});
