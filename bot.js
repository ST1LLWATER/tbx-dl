// discordBot.js
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const puppeteer = require('puppeteer-extra');
const { Worker } = require('node:worker_threads');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('node:fs');
const path = require('node:path');
const m3u8Parser = require('m3u8-parser');
const { rimraf } = require('rimraf');

// Constants
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_CONCURRENT_DOWNLOADS = 2;

// Queue management variables
const urlQueue = [];
let isProcessing = false;
let totalProcessedCount = 0; // Track total processed items for queue position

// Initialize queue file if it doesn't exist
const queueFilePath = path.join(__dirname, 'files.txt');
if (!fs.existsSync(queueFilePath)) {
  fs.writeFileSync(queueFilePath, '');
}

// Function to get current queue position
const getQueuePosition = (url) => {
  return urlQueue.findIndex((item) => item.url === url) + 1;
};

// Function to add URL to queue file
const addToQueueFile = (url, channelId, queuePosition) => {
  fs.appendFileSync(queueFilePath, `${url},${channelId},${queuePosition}\n`);
};

// Function to remove processed URLs from queue file
const removeFromQueueFile = (urls) => {
  const content = fs.readFileSync(queueFilePath, 'utf8');
  const lines = content.split('\n').filter((line) => line.trim());
  const remainingLines = lines.filter((line) => {
    const [url] = line.split(',');
    return !urls.includes(url);
  });
  fs.writeFileSync(queueFilePath, remainingLines.join('\n'));
};

// Function to check file size
const checkFileSize = (filePath) => {
  const stats = fs.statSync(filePath);
  return {
    size: stats.size,
    exceeds: stats.size > MAX_FILE_SIZE_BYTES,
  };
};

// Function to process URLs in batches
const processQueueBatch = async () => {
  if (isProcessing || urlQueue.length === 0) return;

  isProcessing = true;
  const batch = urlQueue.splice(0, MAX_CONCURRENT_DOWNLOADS);

  // Notify which items are being processed
  for (const { url, channelId } of batch) {
    try {
      const channel = await client.channels.fetch(channelId);
      await channel.send(
        `Processing URL at position ${++totalProcessedCount}...`
      );
    } catch (error) {
      console.error(`Error sending processing notification: ${error}`);
    }
  }

  const processPromises = batch.map(async ({ url, channelId }) => {
    try {
      const channel = await client.channels.fetch(channelId);
      const outputFilePath = await processLink(url);

      // Check file size before sending
      const { size, exceeds } = checkFileSize(outputFilePath);
      if (exceeds) {
        await channel.send(
          `Error: File size (${(size / 1024 / 1024).toFixed(
            2
          )}MB) exceeds maximum allowed size of ${MAX_FILE_SIZE_MB}MB`
        );
        fs.unlinkSync(outputFilePath);
      } else {
        await channel.send({ files: [outputFilePath] });
        fs.unlinkSync(outputFilePath);
      }
      return url;
    } catch (error) {
      console.error(`Error processing URL ${url}:`, error);
      const channel = await client.channels.fetch(channelId);
      await channel.send(`Error processing: ${error.message}`);
      return url;
    }
  });

  try {
    const processedUrls = await Promise.all(processPromises);
    removeFromQueueFile(processedUrls);
  } catch (error) {
    console.error('Error in batch processing:', error);
  } finally {
    isProcessing = false;
    if (urlQueue.length > 0) {
      processQueueBatch();
    }
  }
};

// Load existing queue from file on startup
const loadQueueFromFile = () => {
  const content = fs.readFileSync(queueFilePath, 'utf8');
  const lines = content.split('\n').filter((line) => line.trim());
  for (const line of lines) {
    const [url, channelId] = line.split(',');
    urlQueue.push({ url, channelId });
  }
  // Reset total processed count to account for existing queue
  totalProcessedCount = 0;
};

ffmpeg.setFfmpegPath(ffmpegPath);
puppeteer.use(StealthPlugin());

let globalBrowser; // Global Puppeteer instance

// Function to safely close and reset browser
const resetBrowser = async () => {
  try {
    if (globalBrowser) {
      await globalBrowser.close();
    }
  } catch (error) {
    console.error('Error closing browser:', error);
  }
  globalBrowser = null;
};

// Function to get browser instance with retry
const getBrowser = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      if (!globalBrowser || !globalBrowser.isConnected()) {
        await resetBrowser();
        globalBrowser = await puppeteer.launch({
          headless: false,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=1920,1080',
          ],
        });
      }
      return globalBrowser;
    } catch (error) {
      console.error(`Browser launch attempt ${i + 1} failed:`, error);
      await resetBrowser();
      if (i === retries - 1) throw error;
    }
  }
};

const downloadAndMergeVideo = async (m3u8Url, headers, name) => {
  try {
    const axiosConfig = { headers, responseType: 'text' };
    const m3u8Response = await axios.get(m3u8Url, axiosConfig);
    const m3u8Content = m3u8Response.data;

    const parser = new m3u8Parser.Parser();
    parser.push(m3u8Content);
    parser.end();

    const segments = parser.manifest.segments;
    if (!segments || segments.length === 0) {
      console.error('No segments found in m3u8 file.');
      return;
    } else {
      console.log('FOUND SEGMENTS OF LENGTH: ', segments.length);
    }

    // Create a folder to store the downloaded segments
    const segmentsFolder = path.join(__dirname, `segments${Date.now()}`);
    if (!fs.existsSync(segmentsFolder)) {
      fs.mkdirSync(segmentsFolder);
    }

    // Concurrency limit of 50 workers
    const maxConcurrency = 50;
    let currentIndex = 0;
    let activeWorkers = 0;

    // Helper function to run a worker thread to download a segment
    const runWorker = (segment, index) => {
      return new Promise((resolve, reject) => {
        const worker = new Worker(path.join(__dirname, 'segmentWorker.js'), {
          workerData: { segment, index, segmentsFolder, m3u8Url },
        });
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', (code) => {
          if (code !== 0)
            reject(new Error(`Worker stopped with exit code ${code}`));
        });
      });
    };

    // Function to manage the workers and limit concurrency
    const processSegments = async () => {
      const segmentFiles = [];

      // While there are more segments to process
      while (currentIndex < segments.length || activeWorkers > 0) {
        // Check if we can start more workers
        while (
          activeWorkers < maxConcurrency &&
          currentIndex < segments.length
        ) {
          const segment = segments[currentIndex];
          activeWorkers++;
          currentIndex++;

          // Start the worker and handle its completion
          runWorker(segment, currentIndex - 1)
            .then((file) => {
              segmentFiles.push(file);
              activeWorkers--;
            })
            .catch((error) => {
              console.error('Error processing segment:', error);
              activeWorkers--;
            });
        }

        // Wait a bit before checking again
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      return segmentFiles;
    };

    // Start processing the segments with concurrency control
    const segmentFiles = await processSegments();

    console.log(
      'All segments downloaded. Creating file list for ffmpeg concatenation.'
    );

    // Create a file list for ffmpeg
    const fileList = path.join(__dirname, `filelist${Date.now()}.txt`);

    //sort segmentFiles
    segmentFiles.sort((a, b) => {
      const aIndex = Number.parseInt(a.split('_')[1].split('.')[0]);
      const bIndex = Number.parseInt(b.split('_')[1].split('.')[0]);
      return aIndex - bIndex;
    });

    const fileListContent = segmentFiles
      .map((file) => `file '${file}'`)
      .join('\n');
    fs.writeFileSync(fileList, fileListContent);

    console.log('SEGMENT FILES: ', segmentFiles);
    console.log('File list content:', fileListContent);

    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    const outputFilePath = path.join(outputDir, `output_${Date.now()}.mp4`);

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(fileList)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions('-c copy')
        .on('start', (commandLine) => {
          console.log('FFmpeg command:', commandLine);
          console.log('Input file exists:', fs.existsSync(fileList));
          console.log('Working directory:', process.cwd());
          console.log('Absolute input path:', path.resolve(fileList));
        })
        .on('end', async () => {
          console.log(`Video merged and saved as ${outputFilePath}`);
          try {
            if (fileList && fs.existsSync(fileList)) fs.unlinkSync(fileList);
            if (segmentsFolder && fs.existsSync(segmentsFolder)) {
              await rimraf(segmentsFolder);
            }
          } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError);
          }
          resolve(outputFilePath);
        })
        .on('error', async (err) => {
          console.error('FFmpeg error:', err);
          try {
            if (fileList && fs.existsSync(fileList)) fs.unlinkSync(fileList);
            if (segmentsFolder && fs.existsSync(segmentsFolder)) {
              await rimraf(segmentsFolder);
            }
          } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError);
          }
          reject(err);
        })
        .save(outputFilePath);
    });
  } catch (error) {
    console.error('An error occurred:', error);
    throw error;
  }
};

// processLink now returns the merged video file path
async function processLink(link, retries = 2) {
  let page = null;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36'
    );
    await page.setRequestInterception(true);

    let m3u8Url = null;
    let reqHeaders = null;

    const m3u8Promise = new Promise((resolve) => {
      page.on('request', (request) => {
        const url = request.url();
        if (url.includes('M3U8') || url.includes('playlist')) {
          console.log('Found HLS stream request:', url);
          m3u8Url = url;
          reqHeaders = request.headers();
          resolve(m3u8Url);
        }
        request.continue();
      });
    });

    await page.goto(link, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((resolve) => setTimeout(resolve, 15000));
    await Promise.race([
      m3u8Promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('M3U8 timeout')), 30000)
      ),
    ]);

    if (!m3u8Url) {
      throw new Error('No m3u8 URL found');
    }

    const title = await page.title();
    const outputFilePath = await downloadAndMergeVideo(
      m3u8Url,
      reqHeaders,
      title
    );
    return outputFilePath;
  } catch (error) {
    console.error(`Error in processLink (attempt ${3 - retries}/3):`, error);
    if (page) {
      try {
        await page.close();
      } catch (closeError) {
        console.error('Error closing page:', closeError);
      }
    }

    // If connection error, reset browser
    if (
      error.message.includes('Protocol error') ||
      error.message.includes('Connection closed')
    ) {
      await resetBrowser();
      if (retries > 0) {
        console.log(`Retrying processLink, ${retries} attempts remaining...`);
        return processLink(link, retries - 1);
      }
    }
    throw error;
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (error) {
        console.error('Error closing page in finally block:', error);
      }
    }
  }
}

// Discord bot event handlers
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  loadQueueFromFile();
  processQueueBatch();
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith('!scrape')) return;

  const args = message.content.split(' ');
  if (args.length < 2) {
    const reply = await message.reply(
      'Please provide a URL. Usage: `!scrape <url>`'
    );
    // Delete the command message and the bot's reply after 5 seconds
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
    const queuePosition = urlQueue.length + 1;
    const reply = await message.reply(
      `Added URL to queue at position ${queuePosition}. Total URLs in queue: ${queuePosition}`
    );

    // Delete the original command message immediately
    try {
      await message.delete();
    } catch (error) {
      console.error('Error deleting command message:', error);
    }

    addToQueueFile(url, message.channel.id, queuePosition);
    urlQueue.push({ url, channelId: message.channel.id });
    processQueueBatch();
  } catch (error) {
    console.error('Error adding URL to queue:', error);
    await message.channel.send(`Error adding URL to queue: ${error.message}`);
    // Try to delete the command message even if there was an error
    try {
      await message.delete();
    } catch (deleteError) {
      console.error('Error deleting command message after error:', deleteError);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
