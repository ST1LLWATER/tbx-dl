const fs = require('node:fs');
const path = require('node:path');
const { MAX_CONCURRENT_DOWNLOADS } = require('../config/constants');

class QueueManager {
  constructor() {
    this.urlQueue = [];
    this.isProcessing = false;
    this.queueFilePath = path.join(__dirname, '../../files.txt');
    this.initializeQueueFile();
  }

  initializeQueueFile() {
    try {
      if (!fs.existsSync(this.queueFilePath)) {
        fs.writeFileSync(this.queueFilePath, '');
      }
    } catch (error) {
      console.error('Error initializing queue file:', error);
    }
  }

  getQueuePosition(url) {
    return this.urlQueue.findIndex((item) => item.url === url) + 1;
  }

  getCurrentQueueLength() {
    return this.urlQueue.length;
  }

  addToQueueFile(url, channelId) {
    try {
      fs.appendFileSync(this.queueFilePath, `${url},${channelId}\n`);
    } catch (error) {
      console.error('Error adding to queue file:', error);
    }
  }

  removeFromQueueFile(urls) {
    try {
      const content = fs.readFileSync(this.queueFilePath, 'utf8');
      const lines = content.split('\n').filter((line) => line.trim());
      const remainingLines = lines.filter((line) => {
        const [url] = line.split(',');
        return !urls.includes(url);
      });
      fs.writeFileSync(this.queueFilePath, remainingLines.join('\n'));
    } catch (error) {
      console.error('Error removing from queue file:', error);
    }
  }

  addToQueue(url, channelId) {
    const queuePosition = this.getCurrentQueueLength() + 1;
    this.addToQueueFile(url, channelId);
    this.urlQueue.push({ url, channelId, queuePosition });
    return queuePosition;
  }

  getNextBatch() {
    if (this.urlQueue.length === 0) return [];
    return this.urlQueue.splice(0, MAX_CONCURRENT_DOWNLOADS);
  }

  loadQueueFromFile() {
    try {
      const content = fs.readFileSync(this.queueFilePath, 'utf8');
      const lines = content.split('\n').filter((line) => line.trim());
      this.urlQueue = [];
      lines.forEach((line, index) => {
        const [url, channelId] = line.split(',');
        if (url && channelId) {
          this.urlQueue.push({
            url,
            channelId,
            queuePosition: index + 1,
          });
        }
      });
    } catch (error) {
      console.error('Error loading queue from file:', error);
    }
  }

  setProcessing(value) {
    this.isProcessing = value;
  }

  hasItems() {
    return this.urlQueue.length > 0;
  }
}

module.exports = new QueueManager();
