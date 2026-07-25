const { Share, ShareAccessLog, File, Folder } = require('../models');
const { successResponse, paginatedResponse, errorResponse } = require('../utils/response');
const { NotFoundError, ValidationError, ForbiddenError } = require('../utils/errors');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const huby = require('../huby/connector');

const listShares = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Share.findAndCountAll({
      where: { user_id: req.user.id },
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        { model: File, as: 'file' },
        { model: Folder, as: 'folder' }
      ],
      order: [['created_at', 'DESC']]
    });

    return res.json(paginatedResponse(rows, parseInt(page), parseInt(limit), count));
  } catch (error) {
    next(error);
  }
};

const createShare = async (req, res, next) => {
  try {
    const { file_id, folder_id, share_type, password, permission, download_limit, expires_at } = req.body;

    if (file_id) {
      const file = await File.findOne({ where: { id: file_id, user_id: req.user.id } });
      if (!file) throw new NotFoundError('File not found');
    }

    if (folder_id) {
      const folder = await Folder.findOne({ where: { id: folder_id, user_id: req.user.id } });
      if (!folder) throw new NotFoundError('Folder not found');
    }

    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const share = await Share.create({
      user_id: req.user.id,
      file_id,
      folder_id,
      share_token: uuidv4(),
      share_type: share_type || 'link',
      password: passwordHash,
      permission: permission || 'read_only',
      download_limit,
      expires_at,
      created_at: new Date()
    });

    return res.status(201).json(successResponse(share, 'Share created successfully'));
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

    if (!share) {
      throw new NotFoundError('Share not found');
    }

    return res.json(successResponse(share));
  } catch (error) {
    next(error);
  }
};

const updateShare = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password, permission, download_limit, expires_at } = req.body;

    const share = await Share.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!share) {
      throw new NotFoundError('Share not found');
    }

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

    return res.json(successResponse(share, 'Share updated successfully'));
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

    if (!share) {
      throw new NotFoundError('Share not found');
    }

    await share.destroy();

    return res.json(successResponse(null, 'Share deleted successfully'));
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

    await ShareAccessLog.create({
      share_id: share.id,
      ip_address: req.ip,
      action: 'view',
      accessed_at: new Date()
    });

    if (share.password) {
      return res.json(successResponse({ requiresPassword: true }));
    }

    // Exclude password from response
    const shareData = share.toJSON();
    delete shareData.password;

    return res.json(successResponse(shareData));
  } catch (error) {
    next(error);
  }
};

const verifySharePassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const share = await Share.findOne({
      where: { share_token: token },
      include: [
        { model: File, as: 'file' },
        { model: Folder, as: 'folder' }
      ]
    });

    if (!share) {
      throw new NotFoundError('Share not found');
    }

    if (!share.password) {
      const shareData = share.toJSON();
      delete shareData.password;
      return res.json(successResponse(shareData));
    }

    const isValid = await bcrypt.compare(password, share.password);

    if (!isValid) {
      throw new ForbiddenError('Incorrect password');
    }

    const shareData = share.toJSON();
    delete shareData.password;

    return res.json(successResponse(shareData));
  } catch (error) {
    next(error);
  }
};

const downloadSharedFile = async (req, res, next) => {
  try {
    const { token } = req.params;

    const share = await Share.findOne({
      where: { share_token: token },
      include: [{ model: File, as: 'file' }]
    });

    if (!share) {
      throw new NotFoundError('Share not found');
    }

    if (!share.file) {
      throw new ValidationError('This share is not a file share');
    }

    if (share.expires_at && new Date() > new Date(share.expires_at)) {
      throw new ForbiddenError('This share link has expired');
    }

    if (share.download_limit !== null && share.download_count >= share.download_limit) {
      throw new ForbiddenError('This share link has reached its download limit');
    }

    share.download_count += 1;
    await share.save();

    await ShareAccessLog.create({
      share_id: share.id,
      ip_address: req.ip,
      action: 'download',
      accessed_at: new Date()
    });

    const downloadUrl = await huby.getPresignedDownloadUrl(share.file.file_path);

    return res.json(successResponse({ downloadUrl }));
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
