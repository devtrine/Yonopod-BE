const { Folder, File } = require('../models');
const { successResponse, paginatedResponse, errorResponse } = require('../utils/response');
const { NotFoundError, UnauthorizedError, ForbiddenError } = require('../utils/errors');
const bcrypt = require('bcrypt');
const huby = require('../huby/connector');
const { Op } = require('sequelize');

const listFolders = async (req, res, next) => {
  try {
    const { parent_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      user_id: req.user.id,
      deleted_at: null,
      parent_id: parent_id !== undefined ? parent_id : null
    };

    const { count, rows } = await Folder.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
    
    return paginatedResponse(res, rows, count, page, limit, 'Folders retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getFolder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const folder = await Folder.findOne({
      where: { id, user_id: req.user.id, deleted_at: null },
      include: [
        { model: Folder, as: 'children', where: { deleted_at: null }, required: false },
        { model: File, as: 'files', where: { deleted_at: null }, required: false }
      ]
    });

    if (!folder) throw new NotFoundError('Folder not found');

    return successResponse(res, folder, 'Folder retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createFolder = async (req, res, next) => {
  try {
    const { name, parent_id } = req.body;
    
    let path = `/${name}`;
    if (parent_id) {
      const parent = await Folder.findOne({ where: { id: parent_id, user_id: req.user.id } });
      if (!parent) throw new NotFoundError('Parent folder not found');
      path = `${parent.path || ''}/${name}`;
    }

    const folder = await Folder.create({
      user_id: req.user.id,
      name,
      parent_id: parent_id || null,
      path,
      created_at: new Date()
    });

    return successResponse(res, folder, 'Folder created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateFolder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, parent_id } = req.body;

    const folder = await Folder.findOne({
      where: { id, user_id: req.user.id, deleted_at: null }
    });

    if (!folder) throw new NotFoundError('Folder not found');

    if (name !== undefined) folder.name = name;
    
    if (parent_id !== undefined) {
      folder.parent_id = parent_id;
      let path = `/${folder.name}`;
      if (parent_id) {
        const parent = await Folder.findOne({ where: { id: parent_id, user_id: req.user.id } });
        if (!parent) throw new NotFoundError('Parent folder not found');
        path = `${parent.path || ''}/${folder.name}`;
      }
      folder.path = path;
    }

    folder.updated_at = new Date();
    await folder.save();

    return successResponse(res, folder, 'Folder updated successfully');
  } catch (error) {
    next(error);
  }
};

const softDelete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const folder = await Folder.findOne({
      where: { id, user_id: req.user.id, deleted_at: null }
    });

    if (!folder) throw new NotFoundError('Folder not found');

    folder.deleted_at = new Date();
    await folder.save();

    return successResponse(res, null, 'Folder soft deleted successfully');
  } catch (error) {
    next(error);
  }
};

const restore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const folder = await Folder.findOne({
      where: { id, user_id: req.user.id, deleted_at: { [Op.not]: null } }
    });

    if (!folder) throw new NotFoundError('Folder not found in trash');

    folder.deleted_at = null;
    await folder.save();

    return successResponse(res, null, 'Folder restored successfully');
  } catch (error) {
    next(error);
  }
};

const permanentDelete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const folder = await Folder.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!folder) throw new NotFoundError('Folder not found');

    // In a real app we'd recursively delete children and cascade to files
    // But assuming the DB cascade delete does this, we just delete the folder
    await folder.destroy();

    return successResponse(res, null, 'Folder permanently deleted successfully');
  } catch (error) {
    next(error);
  }
};

const lockFolder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { vault_password } = req.body;
    
    const folder = await Folder.findOne({
      where: { id, user_id: req.user.id, deleted_at: null }
    });

    if (!folder) throw new NotFoundError('Folder not found');

    const hashed = await bcrypt.hash(vault_password, 12);
    folder.vault_password = hashed;
    folder.is_locked = true;
    await folder.save();

    return successResponse(res, null, 'Folder locked successfully');
  } catch (error) {
    next(error);
  }
};

const unlockFolder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { vault_password } = req.body;
    
    const folder = await Folder.findOne({
      where: { id, user_id: req.user.id, deleted_at: null },
      include: [
        { model: Folder, as: 'children', where: { deleted_at: null }, required: false },
        { model: File, as: 'files', where: { deleted_at: null }, required: false }
      ]
    });

    if (!folder) throw new NotFoundError('Folder not found');
    if (!folder.is_locked) return successResponse(res, folder, 'Folder is not locked');

    const isMatch = await bcrypt.compare(vault_password, folder.vault_password);
    if (!isMatch) throw new ForbiddenError('Incorrect vault password');

    return successResponse(res, folder, 'Folder unlocked successfully');
  } catch (error) {
    next(error);
  }
};

const listTrash = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Folder.findAndCountAll({
      where: {
        user_id: req.user.id,
        deleted_at: { [Op.not]: null }
      },
      order: [['deleted_at', 'DESC']],
      limit,
      offset
    });

    return paginatedResponse(res, rows, count, page, limit, 'Trash listed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listFolders,
  getFolder,
  createFolder,
  updateFolder,
  softDelete,
  restore,
  permanentDelete,
  lockFolder,
  unlockFolder,
  listTrash
};
