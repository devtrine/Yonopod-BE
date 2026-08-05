const { Share, ShareAccessLog, File, Folder } = require('../models');
const { successResponse, paginatedResponse } = require('../utils/response');
const { NotFoundError, ValidationError, ForbiddenError, BadRequestError } = require('../utils/errors');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const huby = require('../huby/connector');

const listShares = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await Share.findAndCountAll({
      where: { user_id: req.user.id },
      limit: limitNum,
      offset,
      include: [
        { model: File, as: 'file' },
        { model: Folder, as: 'folder' }
      ],
      order: [['created_at', 'DESC']]
    });

    return paginatedResponse(res, rows, count, pageNum, limitNum, 'Shares retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createShare = async (req, res, next) => {
  try {
    const { file_id, folder_id, share_type, password, permission, download_limit, expires_at, vault_password } = req.body;

    if (!file_id && !folder_id) {
      throw new BadRequestError('Either file_id or folder_id must be provided');
    }

    if (file_id) {
      const file = await File.findOne({ where: { id: file_id, user_id: req.user.id } });
      if (!file) throw new NotFoundError('File not found');
    }

  if (folder_id) {
    const folder = await Folder.scope('withPassword').findOne({ 
      where: { id: folder_id, user_id: req.user.id } 
    });
    if (!folder) throw new NotFoundError('Folder not found');

    // 🔒 CEK VAULT: Jika folder berstatus locked/terkunci
    if (folder.is_locked) {
      if (!vault_password) {
        throw new ForbiddenError('Vault password is required to share a locked folder');
      }
      // Verifikasi apakah password vault yang dimasukkan cocok
      const isMatch = await bcrypt.compare(vault_password, folder.vault_password || '');
      if (!isMatch) {
        throw new ForbiddenError('Incorrect vault password');
      }
    }
  }

    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const share = await Share.create({
      user_id: req.user.id,
      file_id: file_id || null,
      folder_id: folder_id || null,
      share_token: uuidv4(),
      share_type: share_type || 'link',
      password: passwordHash,
      permission: permission || 'read_only',
      download_limit: download_limit || null,
      expires_at: expires_at || null,
      created_at: new Date()
    });

    const shareData = share.toJSON();
    delete shareData.password;

    return successResponse(res, shareData, 'Share created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getShare = async (req, res, next) => {
  try {
    const { id } = req.params;

    const share = await Share.findOne({
      where: { id, user_id: req.user.id },
      include: [
        { model: File, as: 'file' },
        { model: Folder, as: 'folder' }
      ]
    });

    if (!share) throw new NotFoundError('Share not found');

    return successResponse(res, share, 'Share retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateShare = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password, permission, download_limit, expires_at } = req.body;

    const share = await Share.scope('withPassword').findOne({
      where: { id, user_id: req.user.id }
    });

    if (!share) throw new NotFoundError('Share not found');

    if (password !== undefined) {
      if (password === null || password === '') {
        share.password = null;
      } else {
        share.password = await bcrypt.hash(password, 10);
      }
    }

    if (permission !== undefined) share.permission = permission;
    if (download_limit !== undefined) share.download_limit = download_limit;
    if (expires_at !== undefined) share.expires_at = expires_at;

    await share.save();

    const shareData = share.toJSON();
    delete shareData.password;

    return successResponse(res, shareData, 'Share updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteShare = async (req, res, next) => {
  try {
    const { id } = req.params;

    const share = await Share.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!share) throw new NotFoundError('Share not found');

    await share.destroy();

    return successResponse(res, null, 'Share deleted successfully');
  } catch (error) {
    next(error);
  }
};

const accessPublicShare = async (req, res, next) => {
  try {
    const { token } = req.params;

    const share = await Share.findOne({
      where: { share_token: token },
      include: [
        { model: File, as: 'file' },
        { model: Folder, as: 'folder' }
      ]
    });

    if (!share) {
      throw new NotFoundError('Share not found or has been deleted');
    }

    if (share.expires_at && new Date() > new Date(share.expires_at)) {
      throw new ForbiddenError('This share link has expired');
    }

    if (share.download_limit !== null && share.download_count >= share.download_limit) {
      throw new ForbiddenError('This share link has reached its download limit');
    }

    // 🔍 CETAK LOG DI TERMINAL UNTUK CEK
    console.log('--- PUBLIC SHARE DATA ---', share.toJSON());

    await ShareAccessLog.create({
      share_id: share.id,
      ip_address: req.ip || req.connection.remoteAddress,
      action: 'view',
      accessed_at: new Date()
    });

    if (share.password) {
      return successResponse(res, { requiresPassword: true }, 'Password required');
    }

    const shareData = share.toJSON();
    delete shareData.password;

    return successResponse(res, shareData, 'Public share accessed successfully');
  } catch (error) {
    next(error);
  }
};

const verifySharePassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const share = await Share.scope('withPassword').findOne({
      where: { share_token: token },
      include: [
        { model: File, as: 'file' },
        { model: Folder, as: 'folder' }
      ]
    });

    if (!share) throw new NotFoundError('Share not found');

    if (share.password) {
      if (!password) {
        throw new BadRequestError('Password is required');
      }

      const isValid = await bcrypt.compare(password, share.password);
      if (!isValid) {
        throw new ForbiddenError('Incorrect password');
      }
    }

    const shareData = share.toJSON();
    delete shareData.password;

    return successResponse(res, shareData, 'Share password verified successfully');
  } catch (error) {
    next(error);
  }
};

const downloadSharedFile = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body; // Menerima password jika link diproteksi

    const share = await Share.scope('withPassword').findOne({
      where: { share_token: token },
      include: [{ model: File, as: 'file' }]
    });

    if (!share) throw new NotFoundError('Share not found');

    if (!share.file) {
      throw new ValidationError('This share is not a file share');
    }

    if (share.expires_at && new Date() > new Date(share.expires_at)) {
      throw new ForbiddenError('This share link has expired');
    }

    if (share.download_limit !== null && share.download_count >= share.download_limit) {
      throw new ForbiddenError('This share link has reached its download limit');
    }

    // 🔒 CEK PASSWORD SHARE: Wajib verifikasi jika share link punya password
    if (share.password) {
      if (!password) {
        throw new ForbiddenError('Password is required to download this file');
      }
      const isValid = await bcrypt.compare(password, share.password);
      if (!isValid) {
        throw new ForbiddenError('Incorrect share password');
      }
    }

    // Update jumlah download
    share.download_count += 1;
    await share.save();

    // Catat log pengunduhan
    await ShareAccessLog.create({
      share_id: share.id,
      ip_address: req.ip,
      action: 'download',
      accessed_at: new Date()
    });

    // Sesuaikan method dengan connector huby kamu (generatePresignedDownloadUrl)
    const downloadUrl = await huby.generatePresignedDownloadUrl(share.file.file_path);

    return successResponse(res, { downloadUrl }, 'Download URL generated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listShares,
  createShare,
  getShare,
  updateShare,
  deleteShare,
  accessPublicShare,
  verifySharePassword,
  downloadSharedFile
};