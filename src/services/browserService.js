const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { BROWSER_ARGS, USER_AGENT } = require('../config/constants');
const { executablePath } = require('puppeteer');

puppeteer.use(StealthPlugin());

class BrowserService {
  constructor() {
    this.browser = null;
    this.activePages = new Set();
  }

  async resetBrowser() {
    try {
      if (this.browser) {
        // Close all active pages first
        for (const page of this.activePages) {
          try {
            await page.close();
          } catch (error) {
            console.error('Error closing page during reset:', error);
          }
        }
        this.activePages.clear();

        await this.browser.close();
      }
    } catch (error) {
      console.error('Error closing browser:', error);
    }
    this.browser = null;
  }

  async getBrowser(retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        if (!this.browser || !this.browser.isConnected()) {
          await this.resetBrowser();
          this.browser = await puppeteer.launch({
            headless: false,
            args: BROWSER_ARGS,
          });

          // Set up disconnect handler
          this.browser.on('disconnected', () => {
            console.log('Browser disconnected, will recreate on next request');
            this.browser = null;
            this.activePages.clear();
          });
        }
        return this.browser;
      } catch (error) {
        console.error(`Browser launch attempt ${i + 1} failed:`, error);
        await this.resetBrowser();
        if (i === retries - 1) throw error;
      }
    }
  }

  async createPage() {
    try {
      const browser = await this.getBrowser();
      const page = await browser.newPage();
      await page.setUserAgent(USER_AGENT);

      // Track the page
      this.activePages.add(page);

      // Remove from tracking when page closes
      page.once('close', () => {
        this.activePages.delete(page);
      });

      return page;
    } catch (error) {
      console.error('Error creating page:', error);
      throw error;
    }
  }

  async closePage(page) {
    try {
      if (page) {
        this.activePages.delete(page);
        await page.close();
      }
    } catch (error) {
      console.error('Error closing page:', error);
    }
  }

  getActivePageCount() {
    return this.activePages.size;
  }

  async cleanup() {
    await this.resetBrowser();
  }
}

// Export a singleton instance
module.exports = new BrowserService();
