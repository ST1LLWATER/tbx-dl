const { MESSAGE_DELETE_TIMEOUT } = require('../config/constants');
const queueManager = require('../utils/queueManager');

async function handleQueueCommand(message) {
  const queueLength = queueManager.getCurrentQueueLength();
  const queueItems = queueManager.getQueueItems();

  const queueEmbed = {
    color: 0x0099ff,
    title: 'Download Queue Status',
    description:
      queueLength === 0 ? 'Queue is empty' : `${queueLength} items in queue`,
    fields: queueItems.map((item, index) => ({
      name: `Position ${item.queuePosition}`,
      value: `URL: ${item.url.substring(0, 50)}...`,
      inline: false,
    })),
    footer: {
      text: 'Queue is processed automatically',
    },
  };

  const reply = await message.reply({ embeds: [queueEmbed] });
  setTimeout(async () => {
    try {
      await message.delete();
      await reply.delete();
    } catch (error) {
      console.error('Error deleting queue status messages:', error);
    }
  }, MESSAGE_DELETE_TIMEOUT);
}

module.exports = handleQueueCommand;
