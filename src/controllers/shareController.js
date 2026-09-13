const { Share, File } = require('../models');
const { successResponse, paginatedResponse } = require('../utils/response');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../utils/errors');
const { createAuditLog } = require('../utils/auditLogger');
const huby = require('../huby/signer');
const { Op } = require('sequelize');

const createShare = async (req, res, next) => {
  try {
    const { file_id, valid_until } = req.body;

    if (!file_id) throw new BadRequestError('File ID is required');

    // Pastikan file eksis, milik user, dan tidak ada di tong sampah
    const file = await File.findOne({
      where: { id: file_id, user_id: req.user.id, deleted_at: null }
    });

    if (!file) throw new NotFoundError('File not found or has been deleted');

    // Buat tautan
    const share = await Share.create({
      user_id: req.user.id,
      file_id,
      valid_until: valid_until || null,
      total_downloads: 0,
      is_terminated: false
    });

    // 📝 Catat ke Audit Log!
    await createAuditLog({
      userId: req.user.id,
      fileId: file.id,
      event: 'CREATE', // Bisa juga tambah enum 'SHARE' kalau mau lebih spesifik di database
      message: `Membuat tautan berbagi untuk file "${file.name}"`
    });

    return successResponse(res, share, 'Share link created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const listShares = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Share.findAndCountAll({
      where: { user_id: req.user.id },
      include: [
        { model: File, as: 'file', attributes: ['id', 'name', 'extension', 'size'] }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return paginatedResponse(res, rows, count, page, limit, 'Shares retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const terminateShare = async (req, res, next) => {
  try {
    const { id } = req.params;

    const share = await Share.findOne({
      where: { id, user_id: req.user.id },
      include: [{ model: File, as: 'file' }]
    });

    if (!share) throw new NotFoundError('Share link not found');
    if (share.is_terminated) throw new BadRequestError('Share link is already terminated');

    share.is_terminated = true;
    await share.save();

    // 📝 Catat ke Audit Log!
    if (share.file) {
      await createAuditLog({
        userId: req.user.id,
        fileId: share.file_id,
        event: 'UPDATE',
        message: `Mematikan akses tautan berbagi untuk file "${share.file.name}"`
      });
    }

    return successResponse(res, share, 'Share link terminated successfully');
  } catch (error) {
    next(error);
  }
};

const accessPublicShare = async (req, res, next) => {
  try {
    const { id } = req.params; // id di sini adalah UUID token dari URL

    const share = await Share.findOne({
      where: { id },
      include: [{ model: File, as: 'file' }]
    });

    // Validasi 1: Tautan eksis?
    if (!share) throw new NotFoundError('Invalid share link');

    // Validasi 2: Apakah file aslinya sudah dihapus?
    if (!share.file || share.file.deleted_at !== null) {
      throw new NotFoundError('The shared file no longer exists');
    }

    // Validasi 3: Apakah tautan dimatikan manual?
    if (share.is_terminated) {
      throw new ForbiddenError('This share link has been terminated by the owner');
    }

    // Validasi 4: Apakah tautan sudah kadaluarsa?
    if (share.valid_until && new Date() > new Date(share.valid_until)) {
      throw new ForbiddenError('This share link has expired');
    }

    // Lolos semua validasi! Tambah counter download & simpan
    share.total_downloads += 1;
    await share.save();

    // Generate URL download sungguhan lewat Huby
    const downloadUrl = await huby.resolve(share.file.file_path);

    // Format response untuk publik
    const publicData = {
      file_name: share.file.name,
      extension: share.file.extension,
      size: share.file.size,
      download_url: downloadUrl
    };

    return successResponse(res, publicData, 'File ready to download');
  } catch (error) {
    next(error);
  }
};

const unTerminateShare = async (req, res, next) => {
  try {
    const { id } = req.params;

    const share = await Share.findOne({
      where: { id, user_id: req.user.id },
      include: [{ model: File, as: 'file' }]
    });

    if (!share) throw new NotFoundError('Share link not found');
    
    // Cegah hit berulang kalau link-nya memang masih aktif
    if (!share.is_terminated) {
      throw new BadRequestError('Share link is already active');
    }

    // 🛡️ Edge Case Cerdas: Jangan biarkan user mengaktifkan link yang masa berlakunya sudah habis!
    if (share.valid_until && new Date() > new Date(share.valid_until)) {
      throw new BadRequestError('Cannot reactivate an expired link. Please create a new share link.');
    }

    // Kembalikan statusnya
    share.is_terminated = false;
    await share.save();

    // 📝 Catat ke Audit Log!
    if (share.file) {
      await createAuditLog({
        userId: req.user.id,
        fileId: share.file_id,
        event: 'UPDATE',
        message: `Mengaktifkan kembali tautan berbagi untuk file "${share.file.name}"`
      });
    }

    return successResponse(res, share, 'Share link reactivated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createShare,
  listShares,
  terminateShare,
  accessPublicShare,
  unTerminateShare
};