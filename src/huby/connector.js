const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand, CopyObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  forcePathStyle: true,
});

const DEFAULT_BUCKET = process.env.S3_BUCKET;
const DEFAULT_EXPIRY = parseInt(process.env.S3_PRESIGNED_EXPIRY) || 3600;

exports.getPresignedUploadUrl = async (key, contentType, expiresIn = DEFAULT_EXPIRY) => {
  const command = new PutObjectCommand({
    Bucket: DEFAULT_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return await getSignedUrl(s3Client, command, { expiresIn });
};

exports.getPresignedDownloadUrl = async (key, expiresIn = DEFAULT_EXPIRY) => {
  const command = new GetObjectCommand({
    Bucket: DEFAULT_BUCKET,
    Key: key,
  });
  return await getSignedUrl(s3Client, command, { expiresIn });
};

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
