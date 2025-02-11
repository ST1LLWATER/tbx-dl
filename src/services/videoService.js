const path = require('node:path');
const fs = require('node:fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const axios = require('axios');
const m3u8Parser = require('m3u8-parser');
const { Worker } = require('node:worker_threads');
const { rimraf } = require('rimraf');
const FileUtils = require('../utils/fileUtils');
const { WORKER_CONCURRENCY, MAX_FILE_SIZE_MB } = require('../config/constants');

ffmpeg.setFfmpegPath(ffmpegPath);

class VideoService {
  async downloadAndMergeVideo(m3u8Url, headers, name) {
    try {
      const segments = await this.getM3u8Segments(m3u8Url, headers);
      if (!segments || segments.length === 0) {
        throw new Error('No segments found in m3u8 file');
      }

      const segmentsFolder = FileUtils.createDirectory(
        path.join(__dirname, `../../segments${Date.now()}`)
      );

      const segmentFiles = await this.downloadSegments(
        segments,
        segmentsFolder,
        m3u8Url
      );

      // Get segments that fit within size limit
      const validSegments = await this.getSegmentsWithinSizeLimit(segmentFiles);
      if (validSegments.length === 0) {
        throw new Error('Could not create a video within size limit');
      }

      const outputPath = await this.mergeSegments(validSegments);
      await this.cleanup(segmentsFolder);

      return outputPath;
    } catch (error) {
      console.error('Error in downloadAndMergeVideo:', error);
      throw error;
    }
  }

  async getSegmentsWithinSizeLimit(segmentFiles) {
    let totalSize = 0;
    const maxSizeBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
    const validSegments = [];

    for (const file of segmentFiles) {
      try {
        const stats = fs.statSync(file);
        if (totalSize + stats.size <= maxSizeBytes) {
          totalSize += stats.size;
          validSegments.push(file);
        } else {
          break; // Stop adding segments once we hit the limit
        }
      } catch (error) {
        console.error(`Error checking segment size for ${file}:`, error);
      }
    }

    console.log(
      `Using ${validSegments.length} out of ${segmentFiles.length} segments to stay within size limit`
    );
    return validSegments;
  }

  async getM3u8Segments(m3u8Url, headers) {
    const axiosConfig = { headers, responseType: 'text' };
    const m3u8Response = await axios.get(m3u8Url, axiosConfig);
    const parser = new m3u8Parser.Parser();
    parser.push(m3u8Response.data);
    parser.end();
    return parser.manifest.segments;
  }

  async downloadSegments(segments, segmentsFolder, m3u8Url) {
    let currentIndex = 0;
    let activeWorkers = 0;
    const segmentFiles = [];

    const runWorker = (segment, index) => {
      return new Promise((resolve, reject) => {
        const worker = new Worker(
          path.join(__dirname, '../workers/segmentWorker.js'),
          {
            workerData: { segment, index, segmentsFolder, m3u8Url },
          }
        );
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', (code) => {
          if (code !== 0)
            reject(new Error(`Worker stopped with exit code ${code}`));
        });
      });
    };

    while (currentIndex < segments.length || activeWorkers > 0) {
      while (
        activeWorkers < WORKER_CONCURRENCY &&
        currentIndex < segments.length
      ) {
        const segment = segments[currentIndex];
        activeWorkers++;
        currentIndex++;

        runWorker(segment, currentIndex - 1)
          .then((file) => {
            if (file) segmentFiles.push(file);
            activeWorkers--;
          })
          .catch((error) => {
            console.error('Error processing segment:', error);
            activeWorkers--;
          });
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return segmentFiles.sort((a, b) => {
      const aIndex = Number.parseInt(a.split('_')[1].split('.')[0]);
      const bIndex = Number.parseInt(b.split('_')[1].split('.')[0]);
      return aIndex - bIndex;
    });
  }

  async mergeSegments(segmentFiles) {
    const fileList = path.join(__dirname, `../../filelist${Date.now()}.txt`);
    const fileListContent = segmentFiles
      .map((file) => `file '${file}'`)
      .join('\n');
    await fs.promises.writeFile(fileList, fileListContent);

    const outputDir = FileUtils.createDirectory(
      path.join(__dirname, '../../output')
    );
    const outputPath = path.join(outputDir, `output_${Date.now()}.mp4`);

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(fileList)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions('-c copy')
        .on('end', async () => {
          await this.cleanup(fileList);
          resolve(outputPath);
        })
        .on('error', async (err) => {
          console.error('FFmpeg error:', err);
          await this.cleanup(fileList);
          reject(err);
        })
        .save(outputPath);
    });
  }

  async cleanup(...paths) {
    for (const path of paths) {
      try {
        if (path && fs.existsSync(path)) {
          await rimraf(path);
        }
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }
  }
}

module.exports = new VideoService();
