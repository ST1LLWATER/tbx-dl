const {
  BOT_PREFIX,
  COMMANDS,
  MESSAGE_DELETE_TIMEOUT,
} = require('../config/constants');

async function handleHelpCommand(message) {
  const helpEmbed = {
    color: 0x0099ff,
    title: 'Video Downloader Bot Help',
    description: 'Here are the available commands:',
    fields: [
      {
        name: `${BOT_PREFIX}${COMMANDS.SCRAPE} <url>`,
        value: 'Download a video from the provided URL',
      },
      {
        name: `${BOT_PREFIX}${COMMANDS.QUEUE}`,
        value: 'Show current queue status',
      },
      {
        name: `${BOT_PREFIX}${COMMANDS.CLEAR}`,
        value: 'Clear the current queue (Admin only)',
      },
      {
        name: `${BOT_PREFIX}${COMMANDS.HELP}`,
        value: 'Show this help message',
      },
    ],
    footer: {
      text: 'Bot will automatically delete messages after processing',
    },
  };

  const reply = await message.reply({ embeds: [helpEmbed] });
  setTimeout(async () => {
    try {
      await message.delete();
      await reply.delete();
    } catch (error) {
      console.error('Error deleting help messages:', error);
    }
  }, MESSAGE_DELETE_TIMEOUT * 2); // Give users more time to read help
}

module.exports = handleHelpCommand;
