const s3 = require('./s3');
const huby = require('./signer');

exports.getPresignedUploadUrl = async (key, contentType, expiresIn = 300) => {
  const result = await s3.presignUploadRequest({
    method: 'PUT',
    key,
    contentType,
    expiresIn
  });
  return result.url;
};

exports.generatePresignedDownloadUrl = async (key, filename, expiresIn = 3600) => {
  return await s3.getPresignedDownloadUrl(key, filename, expiresIn);
};

exports.generatePresignedUploadUrl = async (key) => {
  const result = await s3.presignUploadRequest({
    method: 'PUT',
    key
  });
  return result.url;
};

exports.getFileStatus = async (key) => {
  return await s3.headObject(key);
};

exports.deleteFile = async (key) => {
  return await s3.deleteObject(key);
};

// Expose legacy huby signer for backwards compatibility
exports.legacyHuby = huby;
