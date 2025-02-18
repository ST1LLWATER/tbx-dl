const {
  BOT_PREFIX,
  COMMANDS,
  MESSAGE_DELETE_TIMEOUT,
} = require('../config/constants');
const queueManager = require('../utils/queueManager');

async function handleScrapeCommand(message, args) {
  if (args.length < 1) {
    const reply = await message.reply(
      `Please provide a URL. Usage: \`${BOT_PREFIX}${COMMANDS.SCRAPE} <url>\``
    );
    setTimeout(async () => {
      try {
        await message.delete();
        await reply.delete();
      } catch (error) {
        console.error('Error deleting messages:', error);
      }
    }, MESSAGE_DELETE_TIMEOUT);
    return;
  }

  const url = args[0];
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

    return true; // Signal to start processing queue
  } catch (error) {
    console.error('Error adding URL to queue:', error);
    await message.channel.send(`Error adding URL to queue: ${error.message}`);
    try {
      await message.delete();
    } catch (deleteError) {
      console.error('Error deleting command message after error:', deleteError);
    }
    return false;
  }
}

module.exports = handleScrapeCommand;
