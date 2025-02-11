const { workerData, parentPort } = require('worker_threads');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

async function downloadSegment() {
  const { segment, index, segmentsFolder, m3u8Url } = workerData;

  try {
    // Construct absolute URL for the segment
    const baseUrl = new URL(m3u8Url);
    const segmentUrl = new URL(segment.uri, baseUrl).toString();

    // Download the segment
    const response = await axios({
      method: 'GET',
      url: segmentUrl,
      responseType: 'arraybuffer',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36',
      },
    });

    // Save the segment to a file
    const segmentPath = path.join(segmentsFolder, `segment_${index}.ts`);
    fs.writeFileSync(segmentPath, response.data);

    // Send the segment file path back to the parent
    parentPort.postMessage(segmentPath);
  } catch (error) {
    console.error(`Error downloading segment ${index}:`, error.message);
    throw error;
  }
}

downloadSegment().catch((error) => {
  console.error('Worker error:', error);
  process.exit(1);
});
