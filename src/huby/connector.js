const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand, CopyObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const huby = require("./signer")

exports.getPresignedUploadUrl = async (key, contentType, expiresIn = DEFAULT_EXPIRY) => {
  const command = new PutObjectCommand({
    Bucket: DEFAULT_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return await getSignedUrl(s3Client, command, { expiresIn });
};

exports.generatePresignedDownloadUrl = async (key, expiresIn = huby.defaultExpiry) => {
  return huby.resolve(key, expiresIn)
};

exports.generatePresignedUploadUrl = async (key) => {
  return huby.put(key)
}

exports.getFileStatus = async (key) => {
  return huby.checkStatus(key)
};
