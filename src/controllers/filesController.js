const { File, Folder, Tag, User } = require('../models');
const { successResponse, paginatedResponse, errorResponse } = require('../utils/response');
const { NotFoundError, UnauthorizedError } = require('../utils/errors');
const huby = require('../huby/connector');
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
        { model: Folder, as: "folder" },
        { model: Tag, as: "tags", through: { attributes: [] } }
      ],
      order: [[sort_by, order]],
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

    return successResponse(res, file, 'File retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const presignUpload = async (req, res, next) => {
  try {
    const { name, extension, folder_id = null } = req.body;
    const uuid = uuidv4();
    const folderPath = folder_id ? folder_id : 'root';
    const fileKey = `${req.user.id}/${folderPath}/${uuid}-${name}`;

    const uploadUrl = await huby.generatePresignedUploadUrl(fileKey);

    const file = await File.create({
      user_id: req.user.id,
      file_path: fileKey,
      created_at: new Date(),
      folder_id,
      name,
      extension
    })

    return successResponse(res, { uploadUrl, file }, 'Presigned URL generated successfully');
  } catch (error) {
    next(error);
  }
};

const confirmUpload = async (req, res, next) => {
  try {
    const { file_key, name, extension, folder_id, checksum } = req.body;

    const file = await File.create({
      user_id: req.user.id,
      folder_id,
      name,
      file_path: file_key,
      extension,
      checksum,
      created_at: new Date()
    });

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

    const downloadUrl = await huby.generatePresignedDownloadUrl(file.file_path);

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

    if (huby.deleteFile) {
      await huby.deleteFile(file.file_path);
    }
    
    if (req.user.storage_used < 0n) req.user.storage_used = 0n;
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
  presignUpload,
  confirmUpload,
  downloadFile,
  updateFile,
  softDelete,
  restore,
  permanentDelete,
  listTrash
};
