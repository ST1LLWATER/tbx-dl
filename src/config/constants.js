// Constants for file size limits
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Download configuration
const MAX_CONCURRENT_DOWNLOADS = 2;
const WORKER_CONCURRENCY = 50;

// Timeouts
const PAGE_LOAD_TIMEOUT = 60000;
const M3U8_DETECTION_TIMEOUT = 30000;
const DYNAMIC_CONTENT_WAIT = 15000;

// Browser configuration
const BROWSER_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--disable-gpu',
  '--window-size=1920,1080',
];

// User agent
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36';

module.exports = {
  MAX_FILE_SIZE_MB,
  MAX_FILE_SIZE_BYTES,
  MAX_CONCURRENT_DOWNLOADS,
  WORKER_CONCURRENCY,
  PAGE_LOAD_TIMEOUT,
  M3U8_DETECTION_TIMEOUT,
  DYNAMIC_CONTENT_WAIT,
  BROWSER_ARGS,
  USER_AGENT,
};
