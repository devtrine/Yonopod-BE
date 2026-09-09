const { File, Folder, Tag, User, RecentFile, Favorite } = require('../models');
const { successResponse, paginatedResponse, errorResponse } = require('../utils/response');
const { NotFoundError, UnauthorizedError, ForbiddenError, ValidationError } = require('../utils/errors');
const huby = require('../huby/signer');
const s3 = require('../huby/s3');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

const listFiles = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, folder_id, extension, search, sort_by = 'created_at', order = 'DESC' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      user_id: req.user.id,
      deleted_at: null
    };

    if (folder_id !== undefined) whereClause.folder_id = folder_id;
    if (extension) whereClause.extension = extension;
    if (search) whereClause.name = { [Op.iLike]: `%${search}%` };

    const { count, rows } = await File.findAndCountAll({
      where: whereClause,
      include: [
        { model: Tag, as: "tags", through: { attributes: [] } }
      ],
      order: [[sort_by, order]],
      attributes: ["extension", "name", "id", "folder_id", "created_at", "deleted_at", "is_favorite"],
      limit,
      offset
    });

    return paginatedResponse(res, rows, count, page, limit, 'Files retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const file = await File.findOne({
      where: { id, user_id: req.user.id, deleted_at: null },
      include: [
        { model: Folder, as: "folder" },
        { model: Tag, as: "tags", through: { attributes: [] } }
      ]
    });

    if (!file) throw new NotFoundError('File not found');

    let downloadUrl;
    try {
      downloadUrl = await s3.getPresignedDownloadUrl(file.file_path, file.name);
    } catch (err) {
      downloadUrl = huby.resolve(file.file_path);
    }

    file.dataValues.url = {
      download: downloadUrl
    };

    return successResponse(res, file, 'File retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Endpoint konfigurasi multipart S3 untuk frontend Uppy
 */
const getS3Config = async (req, res, next) => {
  try {
    const config = s3.getConfig();
    return successResponse(res, config, 'S3 configuration retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Uppy v6 Unified Signer Endpoint
 * Menangani semua request penandatanganan dari signRequest Uppy v6:
 * - Single PUT (method: 'PUT', tanpa uploadId)
 * - Create Multipart (method: 'POST', tanpa uploadId)
 * - Upload Part (method: 'PUT', dengan uploadId & partNumber)
 * - Complete Multipart (method: 'POST', dengan uploadId)
 * - Abort Multipart (method: 'DELETE', dengan uploadId)
 * - List Parts (method: 'GET', dengan uploadId)
 */
const s3Presign = async (req, res, next) => {
  try {
    const { method, key, uploadId, partNumber, contentType, size } = req.body;
    const isInitialRequest = (method === 'PUT' && !uploadId) || (method === 'POST' && !uploadId);

    let finalKey = key;

    if (isInitialRequest) {
      // Validasi kuota jika ukuran file diberikan
      if (size !== undefined && size !== null) {
        const used = BigInt(req.user.storage_used || 0);
        const quota = BigInt(req.user.storage_quota || 0);
        if (used + BigInt(size) > quota) {
          throw new ForbiddenError('Storage quota exceeded');
        }
      }

      // Format path terisolasi per user: uploads/${req.user.id}/${uuid}-${sanitizedFilename}
      if (!key.startsWith(`uploads/${req.user.id}/`)) {
        const sanitizedFilename = s3.sanitizeFilename(key);
        finalKey = `uploads/${req.user.id}/${uuidv4()}-${sanitizedFilename}`;
      }
    } else {
      // Verifikasi hak akses key untuk operasi kelanjutan
      if (!key.startsWith(`uploads/${req.user.id}/`)) {
        throw new ForbiddenError('Unauthorized key access');
      }
    }

    const result = await s3.presignUploadRequest({
      method,
      key: finalKey,
      uploadId,
      partNumber,
      contentType
    });

    return res.status(200).json({
      success: true,
      url: result.url,
      key: result.key,
      data: {
        url: result.url,
        key: result.key
      },
      message: 'Presigned URL generated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Legacy presignUpload endpoint (kompatibilitas backward)
 */
const presignUpload = async (req, res, next) => {
  try {
    const { name, extension, folder_id = null, size } = req.body;
    const uuid = uuidv4();
    const sanitizedFilename = s3.sanitizeFilename(name);
    const fileKey = `uploads/${req.user.id}/${uuid}-${sanitizedFilename}`;

    const used = BigInt(req.user.storage_used || 0);
    const quota = BigInt(req.user.storage_quota || 0);
    if (used + BigInt(size) > quota) {
      throw new ForbiddenError('Storage quota exceeded');
    }

    let uploadUrl;
    try {
      const presignRes = await s3.presignUploadRequest({
        method: 'PUT',
        key: fileKey
      });
      uploadUrl = presignRes.url;
    } catch (err) {
      uploadUrl = await huby.put(fileKey);
    }

    const file = await File.create({
      user_id: req.user.id,
      file_path: fileKey,
      created_at: new Date(),
      folder_id,
      name,
      extension,
      size
    });

    req.user.storage_used = used + BigInt(size);
    await req.user.save();

    return successResponse(res, { uploadUrl, file, key: fileKey }, 'Presigned URL generated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Endpoint Konfirmasi Upload setelah file selesai diunggah ke S3.
 * Memvalidasi keberadaan file langsung di S3 via HeadObjectCommand,
 * mencatat record ke DB File, dan memperbarui kuota storage_used user.
 */
const confirmUpload = async (req, res, next) => {
  try {
    const { key, file_key, name, extension, folder_id = null, checksum } = req.body;
    const finalKey = key || file_key;

    if (!finalKey) {
      throw new ValidationError('Object key is required');
    }

    // Verifikasi keamanan kepemilikan key
    if (!finalKey.startsWith(`uploads/${req.user.id}/`)) {
      throw new ForbiddenError('Unauthorized key access');
    }

    // Verifikasi file ke S3 storage jika didukung provider
    let headResult = null;
    try {
      headResult = await s3.headObject(finalKey);
    } catch (err) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        throw new NotFoundError('File tidak ditemukan di storage S3. Pastikan upload telah selesai.');
      }
      // Pada provider S3-compatible tertentu yang menolak method HEAD (e.g. 403 UnknownError),
      // gunakan fallback metadata dari payload request
      console.warn(`[confirmUpload] HeadObject gagal (${err.message}), melanjutkan dengan metadata request.`);
    }

    const actualSize = BigInt(headResult?.ContentLength ?? req.body.size ?? 0);
    const etag = headResult?.ETag ? headResult.ETag.replace(/['"]/g, '') : (checksum || null);

    // Cek kuota dengan ukuran aktual dari S3
    const used = BigInt(req.user.storage_used || 0);
    const quota = BigInt(req.user.storage_quota || 0);
    if (used + actualSize > quota) {
      throw new ForbiddenError('Storage quota exceeded');
    }

    let fileExt = extension;
    if (!fileExt && name && name.includes('.')) {
      fileExt = name.split('.').pop();
    }

    const file = await File.create({
      user_id: req.user.id,
      folder_id: folder_id || null,
      name,
      file_path: finalKey,
      extension: fileExt || '',
      checksum: etag || null,
      size: actualSize.toString(),
      created_at: new Date()
    });

    req.user.storage_used = used + actualSize;
    await req.user.save();

    return successResponse(res, file, 'File uploaded and confirmed successfully', 201);
  } catch (error) {
    next(error);
  }
};

const downloadFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const file = await File.findOne({
      where: { id, user_id: req.user.id, deleted_at: null }
    });

    if (!file) throw new NotFoundError('File not found');

    let downloadUrl;
    try {
      downloadUrl = await s3.getPresignedDownloadUrl(file.file_path, file.name);
    } catch (err) {
      downloadUrl = huby.resolve(file.file_path);
    }

    return successResponse(res, { downloadUrl }, 'Download URL generated successfully');
  } catch (error) {
    next(error);
  }
};

const updateFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, folder_id, is_favorite } = req.body;

    const file = await File.findOne({
      where: { id, user_id: req.user.id, deleted_at: null }
    });

    if (!file) throw new NotFoundError('File not found');

    if (name !== undefined) file.name = name;
    if (folder_id !== undefined) file.folder_id = folder_id;
    if (is_favorite !== undefined) file.is_favorite = is_favorite;
    file.updated_at = new Date();

    await file.save();
    await RecentFile.create({
      user_id: req.user.id,
      file_id: file.id
    });

    return successResponse(res, file, 'File updated successfully');
  } catch (error) {
    next(error);
  }
};

const softDelete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const file = await File.findOne({
      where: { id, user_id: req.user.id, deleted_at: null }
    });

    if (!file) throw new NotFoundError('File not found');
    
    const favorite = await Favorite.findOne({
      where: { file_id: file.id }
    });
    
    if (favorite) await favorite.destroy();

    await file.update({ is_favorite: false });
    await file.destroy();

    return successResponse(res, file, 'File soft deleted successfully');
  } catch (error) {
    next(error);
  }
};

const restore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const file = await File.findOne({
      where: { id, user_id: req.user.id, deleted_at: { [Op.not]: null } },
      paranoid: false
    });

    if (!file) throw new NotFoundError('File not found in trash');

    await file.restore();

    return successResponse(res, null, 'File restored successfully');
  } catch (error) {
    next(error);
  }
};

const permanentDelete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const file = await File.findOne({
      where: { id, user_id: req.user.id },
      paranoid: false
    });

    if (!file) throw new NotFoundError('File not found');

    // Hapus file fisik dari S3 Storage
    try {
      await s3.deleteObject(file.file_path);
    } catch (err) {
      console.warn('Failed to delete S3 object:', file.file_path, err.message);
    }

    const used = BigInt(req.user.storage_used || 0);
    const fileSize = BigInt(file.size || 0);
    req.user.storage_used = used - fileSize < 0n ? 0n : used - fileSize;
    await req.user.save();

    await file.destroy({
      paranoid: false,
      force: true
    });

    return successResponse(res, null, 'File permanently deleted successfully');
  } catch (error) {
    next(error);
  }
};

const listTrash = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await File.findAndCountAll({
      where: {
        user_id: req.user.id,
        deleted_at: { [Op.not]: null }
      },
      order: [['deleted_at', 'DESC']],
      paranoid: false,
      limit,
      offset
    });

    return paginatedResponse(res, rows, count, page, limit, 'Trash listed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listFiles,
  getFile,
  getS3Config,
  s3Presign,
  presignUpload,
  confirmUpload,
  downloadFile,
  updateFile,
  softDelete,
  restore,
  permanentDelete,
  listTrash
};
