const { MESSAGE_DELETE_TIMEOUT } = require('../config/constants');
const queueManager = require('../utils/queueManager');

async function handleClearCommand(message) {
  // Check if user has admin permissions
  if (!message.member.permissions.has('ADMINISTRATOR')) {
    const reply = await message.reply(
      'You need administrator permissions to clear the queue.'
    );
    setTimeout(async () => {
      try {
        await message.delete();
        await reply.delete();
      } catch (error) {
        console.error('Error deleting messages:', error);
      }
    }, MESSAGE_DELETE_TIMEOUT);
    return false;
  }

  try {
    await queueManager.clearQueue();
    const reply = await message.reply('Queue has been cleared.');
    setTimeout(async () => {
      try {
        await message.delete();
        await reply.delete();
      } catch (error) {
        console.error('Error deleting messages:', error);
      }
    }, MESSAGE_DELETE_TIMEOUT);
    return false;
  } catch (error) {
    console.error('Error clearing queue:', error);
    await message.channel.send('An error occurred while clearing the queue.');
    return false;
  }
}

module.exports = handleClearCommand;
