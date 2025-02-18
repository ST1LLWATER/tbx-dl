# 🤖 TBX-DL (TurboBox Downloader)

A powerful Discord bot that efficiently downloads and processes videos from various sources streaming via M3U8, featuring an advanced queue management system and intelligent file handling capabilities. TBX-DL combines stealth browser automation with robust queue management to provide a reliable video downloading solution.

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

## 🔮 Future Scope & Integrations

### 📱 Platform Extensions

- **WhatsApp Integration**:

  - Direct video downloads through WhatsApp commands
  - Group chat support for collaborative downloading
  - Instant video sharing capabilities
  - Custom format selection via WhatsApp interface

- **Telegram Bot Integration**:

  - Parallel bot service on Telegram
  - Inline command support for quick downloads
  - Channel-based queue management
  - Progress tracking through message updates

- **Slack Workspace Integration**:
  - Enterprise-focused video downloading
  - Team-based queue management
  - Workspace-specific configurations
  - Integration with Slack workflows

### 🎯 Feature Expansions

- 🔄 **Cross-Platform Sync**:

  - Unified queue across multiple platforms
  - Synchronized progress tracking
  - Shared configuration management
  - Cross-platform file sharing

- 🎨 **Enhanced Processing**:

  - Advanced video format conversion
  - Custom video trimming and editing
  - Thumbnail generation
  - Subtitle extraction and embedding

- 🔐 **Advanced Security**:
  - Multi-factor authentication
  - Platform-specific access controls
  - Rate limiting per user/platform
  - Enhanced stealth capabilities

### 💡 API Development

- 🔌 **RESTful API Service**:

  - Public API for third-party integrations
  - Webhook support for status updates
  - API key management system
  - Documentation and SDK development

- 🔧 **Developer Tools**:
  - CLI tool for local usage
  - SDK for multiple programming languages
  - Plugin system for custom extensions
  - Integration templates and examples

### 🚀 Scalability Improvements

- ⚡ **Performance Optimizations**:

  - Distributed queue processing
  - Cloud-based video processing
  - Regional content delivery
  - Load balancing capabilities

- 📊 **Analytics & Monitoring**:
  - Usage statistics dashboard
  - Performance metrics tracking
  - Error rate monitoring
  - Resource utilization insights

## 🛠️ Technical Specifications

### System Requirements

- Node.js >= 16.0.0 (for local deployment)
- FFmpeg (automatically installed via ffmpeg-static)
- Discord Bot Token
- Docker and Docker Compose (optional, for containerized deployment)

### Configurable Options

The bot offers extensive customization through `src/config/constants.js`. Here's a complete list of all available configuration options:

#### 💾 File Management

- 📦 `MAX_FILE_SIZE_MB`: Maximum file size limit (default: 10MB)
- 📊 `MAX_FILE_SIZE_BYTES`: Automatically calculated from MAX_FILE_SIZE_MB
- 🔢 `SEGMENTS_PER_MB`: Number of segments per megabyte (default: 3)
- 📈 `MAX_SEGMENTS`: Maximum segments per file (default: 30 for 10MB)
- ⚡ `DOWNLOAD_ALL_SEGMENTS`: Force download all segments regardless of size (default: false)

#### ⚙️ Performance Settings

- 🔄 `MAX_CONCURRENT_DOWNLOADS`: Number of parallel downloads (default: 2)
- 🧵 `WORKER_CONCURRENCY`: Number of worker threads for processing (default: 20)
- ⏱️ `PAGE_LOAD_TIMEOUT`: Maximum wait time for page load (default: 60000ms)
- 🔍 `M3U8_DETECTION_TIMEOUT`: Timeout for M3U8 stream detection (default: 30000ms)
- 🕒 `DYNAMIC_CONTENT_WAIT`: Wait time for dynamic content loading (default: 15000ms)

#### 🤖 Bot Configuration

- ⌨️ `BOT_PREFIX`: Command prefix for the bot (default: "!")
- 🔧 `COMMANDS`: Command mappings:
  - `SCRAPE`: Download command (default: "s")
  - `HELP`: Help command (default: "help")
  - `QUEUE`: Queue status command (default: "q")
  - `CLEAR`: Queue clear command (default: "clear")
- 🧹 `MESSAGE_DELETE_TIMEOUT`: Auto-delete timeout for messages (default: 5000ms)

#### 🌐 Browser Settings

- 🔒 `BROWSER_ARGS`: Chromium launch arguments:
  ```javascript
  [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--window-size=1920,1080',
  ];
  ```
- 🎭 `USER_AGENT`: Custom user agent string for browser requests
  ```javascript
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36';
  ```

All configurations can be modified in `src/config/constants.js` before deployment. For runtime changes, consider implementing a configuration reload mechanism.

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

- `./output`: Permanent storage for processed videos (currently cleanup after serving videos for efficient storage management)
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
