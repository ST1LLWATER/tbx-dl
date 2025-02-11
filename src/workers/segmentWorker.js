const { workerData, parentPort } = require('node:worker_threads');
const path = require('node:path');
const fs = require('node:fs');
const axios = require('axios');

async function downloadSegment() {
  const { segment, index, segmentsFolder, m3u8Url } = workerData;
  const segmentUrl = new URL(segment.uri, m3u8Url).toString();
  const outputPath = path.join(segmentsFolder, `segment_${index}.ts`);

  try {
    const response = await axios.get(segmentUrl, {
      responseType: 'arraybuffer',
    });
    await fs.promises.writeFile(outputPath, response.data);
    parentPort.postMessage(outputPath);
  } catch (error) {
    console.error(`Error downloading segment ${index}:`, error);
    parentPort.postMessage(null);
  }
}

downloadSegment().catch((error) => {
  console.error('Worker error:', error);
  process.exit(1);
});
