# 🤖 Discord Video Downloader Bot

A powerful Discord bot that efficiently downloads and processes videos from various sources streaming via M3U8, featuring an advanced queue management system and intelligent file handling capabilities.

## ✨ Key Features

### Core Functionality

- 📥 Downloads videos from multiple platforms and URLs
- 🎥 Processes videos with automatic format optimization
- 📊 Smart queue management system (processes 2 URLs concurrently)
- 💾 File size limit enforcement (configurable, default 10MB)
- 🧹 Automatic message cleanup for a tidy Discord channel

### 🔄 Queue Service Architecture

The bot implements a robust queue management system to handle video downloads efficiently and prevent system overload:

#### Core Queue Features

- 📊 **Concurrent Processing**: Handles multiple downloads (default: 2) simultaneously while maintaining system stability
- 💾 **Persistent Storage**: Queue state is preserved in a local file system, ensuring no requests are lost during restarts
- 🔁 **Batch Processing**: Implements smart batching to process requests in optimal groups
- 📈 **Position Tracking**: Real-time tracking of queue positions with user feedback

#### Queue Management

- 🎯 **FIFO Implementation**: First-in-first-out queue system ensures fair processing order
- 🔄 **Auto-Recovery**: Automatically recovers queue state after system restarts
- ⚡ **Memory Efficient**: Streams data to disk to handle large queues without memory issues
- 🛑 **Graceful Handling**: Proper error handling and cleanup for failed downloads

#### Queue Commands

- 📥 Check queue status: `!q`
- 🗑️ Clear entire queue: `!clear`
- 📊 View position: Automatic position updates with each submission

#### Technical Implementation

```javascript
// Queue configuration in constants.js
MAX_CONCURRENT_DOWNLOADS = 2; // Concurrent download limit
WORKER_CONCURRENCY = 20; // Worker threads for processing
```

### 🕵️ Browser Automation & Stealth Features

The bot utilizes advanced browser automation with Puppeteer Stealth to bypass anti-bot measures and handle complex video streaming services:

#### 🛡️ Anti-Detection Features

- 🎭 **Chromium Fingerprint Masking**: Prevents detection of automated browser usage
- 🔍 **WebDriver Detection Bypass**: Eliminates traces of automation frameworks
- 🌐 **Network Pattern Normalization**: Mimics natural browser network patterns
- 🖥️ **Hardware Concurrency Spoofing**: Simulates realistic system configurations

#### 🔒 Advanced Protection

- 🕶️ **Stealth Plugin Integration**: Uses `puppeteer-extra-plugin-stealth` for enhanced anonymity
- 🎯 **User Agent Rotation**: Dynamic user agent management
- 🛑 **Anti-Bot Bypass**: Successfully handles services with strict anti-bot measures
- 🔄 **Auto-Recovery**: Intelligent browser session management and recovery

#### 💡 Technical Implementation

```javascript
// Browser configuration
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// Browser launch configuration
const browser = await puppeteer.launch({
  headless: false,
  args: BROWSER_ARGS, // Customized browser arguments
});
```

#### 🎛️ Configurable Browser Options

- 🔧 Custom browser arguments for optimal performance
- ⚡ Automatic page resource management
- 🔄 Session persistence and cleanup
- 🌐 Network interception capabilities

### Advanced Features

- 💪 Persistent queue system that survives bot restarts
- 📈 Real-time progress tracking and notifications
- 🐳 Docker support for seamless deployment
- 🔄 Multi-threaded video segment processing
- 🛡️ Built-in rate limiting and error handling

## 🛠️ Technical Specifications

### System Requirements

- Node.js >= 16.0.0 (for local deployment)
- FFmpeg (automatically installed via ffmpeg-static)
- Discord Bot Token
- Docker and Docker Compose (optional, for containerized deployment)

### Configurable Options

The bot offers extensive customization through `src/config/constants.js`:

- 📦 `MAX_FILE_SIZE_MB`: Adjust maximum file size (default: 10MB)
- ⚡ `MAX_CONCURRENT_DOWNLOADS`: Set parallel download limit (default: 2)
- 🔧 `WORKER_CONCURRENCY`: Configure segment download workers (default: 20)
- ⏱️ `PAGE_LOAD_TIMEOUT`: Customize page load timeout (default: 60s)
- 🔄 `M3U8_DETECTION_TIMEOUT`: Set m3u8 detection timeout (default: 30s)
- And many more customizable options!

## 🚀 Installation & Setup

### 📋 Local Deployment

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd discord-video-downloader
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment:**

   ```bash
   cp .env.example .env
   ```

4. **Configure your `.env` file:**
   ```
   DISCORD_TOKEN=your_discord_bot_token_here
   ```

### 🐳 Docker Deployment

1. **Clone and prepare:**

   ```bash
   git clone <repository-url>
   cd discord-video-downloader
   cp .env.example .env
   ```

2. **Build and launch:**

   ```bash
   docker-compose up -d
   ```

3. **Monitor logs:**
   ```bash
   docker-compose logs -f
   ```

## 💻 Usage Guide

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
# Local
npm start

# Docker
docker-compose up -d
```

### 🤖 Bot Commands

- `!s <url>` - Add a video URL to download queue
- `!q` - View current queue status
- `!help` - Display help information
- `!clear` - Clear the download queue

## 📁 Project Structure

```
src/
├── config/         # Configuration and constants
├── services/       # Core service implementations
├── utils/          # Helper utilities
├── workers/        # Worker thread processors
└── index.js        # Main bot entry point
```

## 💾 Data Persistence

### Docker Volumes

- `./output`: Permanent storage for processed videos
- `./segments`: Temporary storage for video processing

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🌟 Support & Community

- 📫 Report issues via GitHub Issues
- 💡 Feature requests are welcome
- 🤝 Pull requests are encouraged

---

Made with ❤️ for the Discord community
