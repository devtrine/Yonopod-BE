const {
  S3Client,
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  ListPartsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

require('dotenv').config();

/**
 * Mengonversi string ukuran memori (e.g. '64MB', '100MB', '1GB') ke integer bytes.
 */
function parseSizeToBytes(value, defaultBytes = 64 * 1024 * 1024) {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return Math.floor(value);
  }
  if (!value || typeof value !== 'string') {
    return defaultBytes;
  }

  const trimmed = value.trim().toUpperCase();
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB)?$/);
  if (!match) {
    const parsedInt = parseInt(trimmed, 10);
    return Number.isNaN(parsedInt) ? defaultBytes : parsedInt;
  }

  const number = parseFloat(match[1]);
  const unit = match[2] || 'B';

  const multipliers = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    TB: 1024 * 1024 * 1024 * 1024
  };

  return Math.floor(number * (multipliers[unit] || 1));
}

const endpoint = process.env.S3_ENDPOINT || undefined;
const region = process.env.S3_REGION || 'us-east-1';
const bucket = process.env.S3_BUCKET || '';
const accessKeyId = process.env.S3_ACCESS_KEY || '';
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || '';
const forcePathStyle = process.env.S3_ADDRESSING_STYLE === 'true';

const multipartThresholdBytes = parseSizeToBytes(process.env.S3_MULTIPART_TRESSHOLD, 64 * 1024 * 1024);
const multipartChunkSizeBytes = parseSizeToBytes(process.env.S3_MULTIPART_CHUNKSIZE, 64 * 1024 * 1024);

const s3Client = new S3Client({
  region,
  endpoint: endpoint || undefined,
  forcePathStyle,
  credentials: (accessKeyId && secretAccessKey) ? {
    accessKeyId,
    secretAccessKey
  } : undefined
});

function sanitizeFilename(filename) {
  if (!filename) return 'unnamed';
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Menghasilkan Presigned URL untuk operasi Uppy v6 signRequest:
 * 1. Single PUT (method: 'PUT', tanpa uploadId)
 * 2. Create Multipart (method: 'POST', tanpa uploadId)
 * 3. Sign Part (method: 'PUT', dengan uploadId & partNumber)
 * 4. Complete Multipart (method: 'POST', dengan uploadId)
 * 5. Abort Multipart (method: 'DELETE', dengan uploadId)
 * 6. List Parts (method: 'GET', dengan uploadId)
 */
async function presignUploadRequest({ method, key, uploadId, partNumber, contentType, expiresIn = 300 }) {
  if (!bucket) {
    throw new Error('S3_BUCKET belum dikonfigurasi di environment.');
  }

  // 1. Single PutObject (< threshold)
  if (method === 'PUT' && !uploadId) {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType || 'application/octet-stream'
    });
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return { url, key };
  }

  // 2. Inisiasi Multipart Upload
  if (method === 'POST' && !uploadId) {
    const command = new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType || 'application/octet-stream'
    });
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return { url, key };
  }

  // 3. Presign Upload Part
  if (method === 'PUT' && uploadId && partNumber) {
    const command = new UploadPartCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
      PartNumber: Number(partNumber)
    });
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return { url, key };
  }

  // 4. Complete Multipart Upload
  if (method === 'POST' && uploadId) {
    const command = new CompleteMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId
    });
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return { url, key };
  }

  // 5. Abort Multipart Upload
  if (method === 'DELETE' && uploadId) {
    const command = new AbortMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId
    });
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return { url, key };
  }

  // 6. List Parts
  if (method === 'GET' && uploadId) {
    const command = new ListPartsCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId
    });
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return { url, key };
  }

  throw new Error(`Operasi request presign tidak valid: method=${method}, uploadId=${uploadId}, partNumber=${partNumber}`);
}

/**
 * Menghasilkan presigned GET URL untuk mendownload/menampilkan file
 */
async function getPresignedDownloadUrl(key, filename, expiresIn = 3600) {
  if (!bucket) {
    throw new Error('S3_BUCKET belum dikonfigurasi di environment.');
  }

  const params = {
    Bucket: bucket,
    Key: key
  };

  if (filename) {
    params.ResponseContentDisposition = `attachment; filename="${encodeURIComponent(filename)}"`;
  }

  const command = new GetObjectCommand(params);
  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Mendapatkan metadata objek langsung dari S3 (verifikasi keberadaan, ukuran, dsb.)
 */
async function headObject(key) {
  if (!bucket) {
    throw new Error('S3_BUCKET belum dikonfigurasi di environment.');
  }

  const command = new HeadObjectCommand({
    Bucket: bucket,
    Key: key
  });
  return await s3Client.send(command);
}

/**
 * Menghapus objek fisik dari S3 bucket
 */
async function deleteObject(key) {
  if (!bucket) {
    throw new Error('S3_BUCKET belum dikonfigurasi di environment.');
  }

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key
  });
  return await s3Client.send(command);
}

/**
 * Mendapatkan konfigurasi multipart S3 untuk frontend
 */
function getConfig() {
  return {
    multipart_threshold_bytes: multipartThresholdBytes,
    multipart_chunksize_bytes: multipartChunkSizeBytes,
    multipart_threshold_raw: process.env.S3_MULTIPART_TRESSHOLD || '64MB',
    multipart_chunksize_raw: process.env.S3_MULTIPART_CHUNKSIZE || '64MB'
  };
}

module.exports = {
  s3Client,
  bucket,
  sanitizeFilename,
  parseSizeToBytes,
  presignUploadRequest,
  getPresignedDownloadUrl,
  headObject,
  deleteObject,
  getConfig
};
