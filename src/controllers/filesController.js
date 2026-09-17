const path = require('path');
const { File, Folder, Tag, User, RecentFile, Favorite, sequelize } = require('../models');
const { successResponse, paginatedResponse, errorResponse } = require('../utils/response');
const { NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, ConflictError } = require('../utils/errors');
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
    const { method, key, uploadId, partNumber, contentType, size, name, extension, folder_id } = req.body;

    // Cegah path traversal (YONO-02)
    if (!key || key.includes('..')) {
      throw new ForbiddenError('Invalid key format');
    }

    const isInitialRequest = (method === 'PUT' && !uploadId) || (method === 'POST' && !uploadId);
    let finalKey = key;
    let fileRecord = null;
    const bypassHook = process.env.BHV_BYPASS_HOOK === 'true';

    if (isInitialRequest) {
      // Validasi kuota jika ukuran file diberikan (YONO-11)
      const used = BigInt(req.user.storage_used || 0);
      const quota = BigInt(req.user.storage_quota || 0);
      if (size !== undefined && size !== null) {
        if (used + BigInt(size) > quota) {
          throw new ForbiddenError('Storage quota exceeded');
        }
      }

      // Validasi folder_id jika disertakan
      if (folder_id) {
        const folder = await Folder.findOne({
          where: { id: folder_id, user_id: req.user.id }
        });
        if (!folder) {
          throw new NotFoundError('Target folder not found');
        }
      }

      // Format path terisolasi aman per user di bawah kontrol server: uploads/${req.user.id}/${uuid}-${sanitizedFilename}
      const rawName = name || path.basename(key);
      const sanitizedFilename = s3.sanitizeFilename(rawName);
      finalKey = `uploads/${req.user.id}/${uuidv4()}-${sanitizedFilename}`;

      let fileExt = extension;
      if (!fileExt && rawName && rawName.includes('.')) {
        fileExt = rawName.split('.').pop();
      }

      // Record File dibuat secara otomatis saat CreateMultipartUpload / PutObject
      if (bypassHook && method === 'PUT') {
        // Auto-confirm untuk Single PUT saat BHV_BYPASS_HOOK aktif
        const actualSize = BigInt(size || 0);
        await sequelize.transaction(async (t) => {
          const user = await User.findByPk(req.user.id, { transaction: t, lock: t.LOCK.UPDATE });
          const currentUsed = BigInt(user.storage_used || 0);
          const currentQuota = BigInt(user.storage_quota || 0);
          if (currentUsed + actualSize > currentQuota) {
            throw new ForbiddenError('Storage quota exceeded');
          }

          fileRecord = await File.create({
            user_id: req.user.id,
            folder_id: folder_id || null,
            name: rawName,
            file_path: finalKey,
            extension: fileExt || '',
            size: actualSize.toString(),
            created_at: new Date()
          }, { transaction: t });

          user.storage_used = currentUsed + actualSize;
          await user.save({ transaction: t });
          req.user.storage_used = user.storage_used;
        });
      } else {
        // Standard mode (BHV_BYPASS_HOOK=false atau Multipart): simpan record dengan size: 0
        fileRecord = await File.create({
          user_id: req.user.id,
          folder_id: folder_id || null,
          name: rawName,
          file_path: finalKey,
          extension: fileExt || '',
          size: '0',
          created_at: new Date()
        });
      }
    } else {
      // Verifikasi hak akses key untuk operasi kelanjutan multipart (YONO-02)
      const expectedPrefix = `uploads/${req.user.id}/`;
      if (!key.startsWith(expectedPrefix)) {
        throw new ForbiddenError('Unauthorized key access');
      }
      finalKey = key;

      // Jika BHV_BYPASS_HOOK aktif dan ini adalah CompleteMultipartUpload (POST dengan uploadId):
      if (bypassHook && method === 'POST' && uploadId) {
        const existingFile = await File.findOne({
          where: { file_path: finalKey, user_id: req.user.id }
        });
        if (existingFile && BigInt(existingFile.size || 0) === 0n) {
          let headResult = null;
          try {
            headResult = await s3.headObject(finalKey);
          } catch (err) {
            // Abaikan jika HEAD belum tersedia
          }
          const actualSize = BigInt(headResult?.ContentLength ?? size ?? 0);
          const etag = headResult?.ETag ? headResult.ETag.replace(/['"]/g, '') : null;

          if (actualSize > 0n) {
            await sequelize.transaction(async (t) => {
              const user = await User.findByPk(req.user.id, { transaction: t, lock: t.LOCK.UPDATE });
              const currentUsed = BigInt(user.storage_used || 0);
              const currentQuota = BigInt(user.storage_quota || 0);
              if (currentUsed + actualSize > currentQuota) {
                throw new ForbiddenError('Storage quota exceeded');
              }

              existingFile.size = actualSize.toString();
              if (etag) existingFile.checksum = etag;
              await existingFile.save({ transaction: t });

              user.storage_used = currentUsed + actualSize;
              await user.save({ transaction: t });
              req.user.storage_used = user.storage_used;
              fileRecord = existingFile;
            });
          }
        }
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
        key: result.key,
        file: fileRecord || undefined
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
 * @deprecated
 * Endpoint Konfirmasi Upload setelah file selesai diunggah ke S3.
 * Deprecated: konfirmasi upload ditangani oleh webhook S3 (confirmUploadFromWebhook) atau BHV_BYPASS_HOOK.
 */
const confirmUpload = async (req, res, next) => {
  try {
    const { key, file_key, name, extension, folder_id = null, checksum } = req.body;
    const finalKey = key || file_key;

    if (!finalKey) {
      throw new ValidationError('Object key is required');
    }

    res.set('X-Deprecated', 'confirmUpload is deprecated. Upload confirmation is handled via S3 webhook.');

    // Verifikasi keamanan kepemilikan key & cegah path traversal (YONO-01)
    const expectedPrefix = `uploads/${req.user.id}/`;
    if (!finalKey.startsWith(expectedPrefix) || finalKey.includes('..')) {
      throw new ForbiddenError('Unauthorized key access');
    }

    const bypassHook = process.env.BHV_BYPASS_HOOK === 'true';

    // Jika BHV_BYPASS_HOOK aktif, kembalikan record file yang sudah dibuat/dikonfirmasi
    if (bypassHook) {
      const existingFile = await File.findOne({
        where: { file_path: finalKey, user_id: req.user.id }
      });
      if (existingFile) {
        return successResponse(res, existingFile, 'File confirmed successfully', 200);
      }
    } else {
      // Jika BHV_BYPASS_HOOK false, konfirmasi hanya ditangani oleh confirmUploadFromWebhook
      return res.status(410).json({
        status: 'error',
        message: 'confirmUpload is deprecated. Upload confirmation is handled exclusively via S3 provider webhook.'
      });
    }

    // Fallback jika record belum terbuat di DB saat bypassHook aktif
    let headResult = null;
    try {
      headResult = await s3.headObject(finalKey);
    } catch (err) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        throw new NotFoundError('File tidak ditemukan di storage S3. Pastikan upload telah selesai.');
      }
      console.warn(`[confirmUpload] HeadObject gagal (${err.message}), melanjutkan dengan metadata request.`);
    }

    const actualSize = BigInt(headResult?.ContentLength ?? req.body.size ?? 0);
    const etag = headResult?.ETag ? headResult.ETag.replace(/['"]/g, '') : (checksum || null);

    let fileExt = extension;
    if (!fileExt && name && name.includes('.')) {
      fileExt = name.split('.').pop();
    }

    let file;
    await sequelize.transaction(async (t) => {
      const user = await User.findByPk(req.user.id, { transaction: t, lock: t.LOCK.UPDATE });
      const used = BigInt(user.storage_used || 0);
      const quota = BigInt(user.storage_quota || 0);
      if (used + actualSize > quota) {
        throw new ForbiddenError('Storage quota exceeded');
      }

      file = await File.create({
        user_id: req.user.id,
        folder_id: folder_id || null,
        name,
        file_path: finalKey,
        extension: fileExt || '',
        checksum: etag || null,
        size: actualSize.toString(),
        created_at: new Date()
      }, { transaction: t });

      user.storage_used = used + actualSize;
      await user.save({ transaction: t });
      req.user.storage_used = user.storage_used;
    });

    return successResponse(res, file, 'File uploaded and confirmed successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * S3 Provider Webhook Endpoint
 * Dipanggil oleh S3 Provider setelah upload berhasil ke bucket S3.
 * Mengupdate size file dan storage_used user secara atomik.
 */
const confirmUploadFromWebhook = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const webhookSecret = process.env.S3_WEBHOOK_SECRET;

    if (!webhookSecret || !authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Invalid or missing webhook bearer token');
    }

    const token = authHeader.substring(7).trim();
    if (token !== webhookSecret) {
      throw new UnauthorizedError('Invalid or missing webhook bearer token');
    }

    const { key, size, etag } = req.body;

    if (!key || key.includes('..')) {
      throw new ForbiddenError('Invalid key format');
    }

    const file = await File.findOne({
      where: { file_path: key },
      paranoid: false
    });

    if (!file) {
      throw new NotFoundError(`File record not found for key: ${key}`);
    }

    if (BigInt(file.size || 0) > 0n || file.checksum) {
      throw new ConflictError('File already confirmed');
    }

    const actualSize = BigInt(size || 0);

    await sequelize.transaction(async (t) => {
      const user = await User.findByPk(file.user_id, {
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      const currentUsed = BigInt(user.storage_used || 0);
      const currentQuota = BigInt(user.storage_quota || 0);

      if (currentUsed + actualSize > currentQuota) {
        throw new ForbiddenError('Storage quota exceeded');
      }

      file.size = actualSize.toString();
      if (etag) {
        file.checksum = etag.replace(/['"]/g, '');
      }
      await file.save({ transaction: t });

      user.storage_used = currentUsed + actualSize;
      await user.save({ transaction: t });
    });

    return successResponse(res, file, 'File confirmed via S3 webhook successfully', 200);
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
  confirmUploadFromWebhook,
  downloadFile,
  updateFile,
  softDelete,
  restore,
  permanentDelete,
  listTrash
};
