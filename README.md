# Discord Video Downloader Bot

A Discord bot that downloads and processes videos from various sources, with queue management and file size limits.

## Features

- Downloads and processes videos from URLs
- Queue management system (processes 2 URLs at a time)
- File size limit checking
- Automatic message cleanup
- Persistent queue across bot restarts
- Progress tracking and notifications
- Docker support for easy deployment

## Prerequisites

- Node.js >= 16.0.0 (for local deployment)
- FFmpeg (automatically installed via ffmpeg-static)
- A Discord Bot Token
- Docker and Docker Compose (for Docker deployment)

## Installation

### Local Deployment

1. Clone the repository:

```bash
git clone <repository-url>
cd discord-video-downloader
```

2. Install dependencies:

```bash
npm install
```

3. Create environment file:

```bash
cp .env.example .env
```

4. Edit `.env` and add your Discord bot token:

```
DISCORD_TOKEN=your_discord_bot_token_here
```

### Docker Deployment

1. Clone the repository:

```bash
git clone <repository-url>
cd discord-video-downloader
```

2. Create and configure environment file:

```bash
cp .env.example .env
# Edit .env with your Discord bot token
```

3. Build and start the container:

```bash
docker-compose up -d
```

4. View logs:

```bash
docker-compose logs -f
```

5. Stop the bot:

```bash
docker-compose down
```

## Usage

### Local Development

```bash
npm run dev
```

### Local Production

```bash
npm start
```

### Docker Production

```bash
# Start the bot
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the bot
docker-compose down
```

### Bot Commands

- `!scrape <url>` - Add a URL to the download queue

## Directory Structure

```
src/
├── config/         # Configuration constants
├── services/       # Core services (browser, video)
├── utils/          # Utility functions
├── workers/        # Worker thread scripts
└── index.js        # Main bot file
```

## Configuration

You can modify the following constants in `src/config/constants.js`:

- `MAX_FILE_SIZE_MB`: Maximum file size limit (default: 10MB)
- `MAX_CONCURRENT_DOWNLOADS`: Number of concurrent downloads (default: 2)
- `WORKER_CONCURRENCY`: Number of segment download workers (default: 50)
- Various timeout values and browser configurations

## Docker Volume Locations

The Docker setup includes two persistent volumes:

- `./output`: Where processed videos are stored
- `./segments`: Temporary storage for video segments during processing

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

ISC
