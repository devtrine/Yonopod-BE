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

exports.generatePresignedDownloadUrl = async (key, expiresIn = DEFAULT_EXPIRY) => {
  return "http://linux-rijal"
};

exports.generatePresignedUploadUrl = async (key) => {
  return huby.put(key)
}

exports.deleteFile = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: DEFAULT_BUCKET,
    Key: key,
  });
  return await s3Client.send(command);
};

exports.getFileMetadata = async (key) => {
  const command = new HeadObjectCommand({
    Bucket: DEFAULT_BUCKET,
    Key: key,
  });
  return await s3Client.send(command);
};

exports.copyFile = async (sourceKey, destKey) => {
  const command = new CopyObjectCommand({
    Bucket: DEFAULT_BUCKET,
    CopySource: `${DEFAULT_BUCKET}/${sourceKey}`,
    Key: destKey,
  });
  return await s3Client.send(command);
};
