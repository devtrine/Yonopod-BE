const { AuditLog } = require('../models');
const { BadRequestError } = require('../utils/errors');

const createAuditLog = async ({ userId, event, message, folderId = null, fileId = null }) => {
  // 🛡️ Validasi Aturan: Harus pilih salah satu
  if (folderId && fileId) {
    throw new BadRequestError('Audit log tidak boleh memiliki folder_id dan file_id secara bersamaan.');
  }
  
  if (!folderId && !fileId) {
    throw new BadRequestError('Audit log harus merujuk ke sebuah folder_id ATAU file_id.');
  }

  // Eksekusi insert ke database
  const log = await AuditLog.create({
    user_id: userId,
    folder_id: folderId,
    file_id: fileId,
    event,
    message
  });

  return log;
};

module.exports = {
  createAuditLog
};