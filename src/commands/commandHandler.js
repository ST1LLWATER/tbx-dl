const { BOT_PREFIX, COMMANDS } = require('../config/constants');
const handleScrapeCommand = require('./scrapeCommand');
const handleHelpCommand = require('./helpCommand');
const handleQueueCommand = require('./queueCommand');

class CommandHandler {
  constructor() {
    this.commands = new Map([
      [COMMANDS.SCRAPE, handleScrapeCommand],
      [COMMANDS.HELP, handleHelpCommand],
      [COMMANDS.QUEUE, handleQueueCommand],
    ]);
  }

  async handleMessage(message) {
    if (message.author.bot) return false;
    if (!message.content.startsWith(BOT_PREFIX)) return false;

    const args = message.content.slice(BOT_PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    const handler = this.commands.get(command);
    if (!handler) return false;

    try {
      return await handler(message, args);
    } catch (error) {
      console.error(`Error handling command ${command}:`, error);
      await message.channel.send(
        'An error occurred while processing your command.'
      );
      return false;
    }
  }
}

module.exports = new CommandHandler();
