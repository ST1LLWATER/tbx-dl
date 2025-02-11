const fs = require('node:fs');
const { MAX_FILE_SIZE_BYTES } = require('../config/constants');

function checkFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      exceeds: stats.size > MAX_FILE_SIZE_BYTES,
    };
  } catch (error) {
    console.error(`Error checking file size for ${filePath}:`, error);
    return { size: 0, exceeds: false };
  }
}

async function deleteFile(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
  }
}

function createDirectory(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return dirPath;
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
    throw error;
  }
}

function formatFileSize(bytes) {
  return (bytes / 1024 / 1024).toFixed(2);
}

module.exports = {
  checkFileSize,
  deleteFile,
  createDirectory,
  formatFileSize,
};
