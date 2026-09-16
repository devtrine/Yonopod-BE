const { Folder, File } = require('../models');

/**
 * Format bytes to human-readable string
 */
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Calculate folder size recursively
 */
const calculateFolderSizeRecursively = async (folderId, userId) => {
  let totalSizeBytes = 0;

  // 1. Jumlahkan ukuran semua file TEPAT di dalam folder ini
  const fileSum = await File.sum('size', {
    where: { folder_id: folderId, user_id: userId }
  });
  
  totalSizeBytes += (fileSum || 0);

  // 2. Cari apakah folder ini punya sub-folder
  const subFolders = await Folder.findAll({
    where: { parent_id: folderId, user_id: userId },
    attributes: ['id'],
    raw: true
  });

  // 3. Jika ada sub-folder, jalankan rekursi
  for (const subFolder of subFolders) {
    const subSize = await calculateFolderSizeRecursively(subFolder.id, userId);
    totalSizeBytes += subSize;
  }

  return totalSizeBytes;
};

module.exports = {
  formatBytes,
  calculateFolderSizeRecursively
};