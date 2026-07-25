const { Tag, FileTag, File } = require('../models');
const { successResponse, paginatedResponse, errorResponse } = require('../utils/response');
const { NotFoundError, ValidationError, ForbiddenError } = require('../utils/errors');

const listTags = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Tag.findAndCountAll({
      where: { user_id: req.user.id },
      limit,
      offset,
      include: [{
        model: FileTag,
        as: 'file_tags',
        attributes: []
      }],
      attributes: {
        include: [
          [
            Tag.sequelize.fn('COUNT', Tag.sequelize.col('file_tags.id')),
            'files_count'
          ]
        ]
      },
      group: ['Tag.id'],
      order: [['created_at', 'DESC']],
      subQuery: false
    });

    return res.json(paginatedResponse(rows, page, limit, count.length || count));
  } catch (error) {
    next(error);
  }
};

const createTag = async (req, res, next) => {
  try {
    const { name, color } = req.body;

    const existingTag = await Tag.findOne({
      where: { user_id: req.user.id, name }
    });

    if (existingTag) {
      throw new ValidationError('Tag with this name already exists');
    }

    const tag = await Tag.create({
      user_id: req.user.id,
      name,
      color,
      created_at: new Date()
    });

    return res.status(201).json(successResponse(tag, 'Tag created successfully'));
  } catch (error) {
    next(error);
  }
};

const updateTag = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    const tag = await Tag.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!tag) {
      throw new NotFoundError('Tag not found');
    }

    if (name && name !== tag.name) {
      const existingTag = await Tag.findOne({
        where: { user_id: req.user.id, name }
      });

      if (existingTag) {
        throw new ValidationError('Tag with this name already exists');
      }
    }

    if (name !== undefined) tag.name = name;
    if (color !== undefined) tag.color = color;

    await tag.save();

    return res.json(successResponse(tag, 'Tag updated successfully'));
  } catch (error) {
    next(error);
  }
};

const deleteTag = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tag = await Tag.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!tag) {
      throw new NotFoundError('Tag not found');
    }

    await tag.destroy();

    return res.json(successResponse(null, 'Tag deleted successfully'));
  } catch (error) {
    next(error);
  }
};

const addTagToFile = async (req, res, next) => {
  try {
    const { id, fileId } = req.params;

    const tag = await Tag.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!tag) {
      throw new NotFoundError('Tag not found');
    }

    const file = await File.findOne({
      where: { id: fileId, user_id: req.user.id }
    });

    if (!file) {
      throw new NotFoundError('File not found');
    }

    const existingFileTag = await FileTag.findOne({
      where: { tag_id: id, file_id: fileId }
    });

    if (existingFileTag) {
      return res.status(409).json(errorResponse('File is already tagged with this tag', 409));
    }

    await FileTag.create({
      tag_id: id,
      file_id: fileId
    });

    return res.json(successResponse(null, 'Tag added to file successfully'));
  } catch (error) {
    next(error);
  }
};

const removeTagFromFile = async (req, res, next) => {
  try {
    const { id, fileId } = req.params;

    // First ensure tag belongs to user
    const tag = await Tag.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!tag) {
      throw new NotFoundError('Tag not found');
    }

    const fileTag = await FileTag.findOne({
      where: { tag_id: id, file_id: fileId }
    });

    if (!fileTag) {
      throw new NotFoundError('File tag not found');
    }

    await fileTag.destroy();

    return res.json(successResponse(null, 'Tag removed from file successfully'));
  } catch (error) {
    next(error);
  }
};

const getFilesByTag = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const tag = await Tag.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!tag) {
      throw new NotFoundError('Tag not found');
    }

    const { count, rows } = await FileTag.findAndCountAll({
      where: { tag_id: id },
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [{
        model: File,
        as: 'file',
        where: { user_id: req.user.id } // Just to be extra safe
      }]
    });

    const files = rows.map(ft => ft.file);

    return res.json(paginatedResponse(files, parseInt(page), parseInt(limit), count));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listTags,
  createTag,
  updateTag,
  deleteTag,
  addTagToFile,
  removeTagFromFile,
  getFilesByTag
};
