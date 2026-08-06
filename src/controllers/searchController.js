const { File, Folder, Tag, Sequelize } = require('../models');
const { successResponse } = require('../utils/response');
const { Op } = Sequelize;

const search = async (req, res, next) => {
    try {
        const {
            q, type, folderId, favorite, from, to, tag, label,
            page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC'
        } = req.query;

        const offset = (page - 1) * limit;

        const fileWhere = { user_id: req.user.id };
        const folderWhere = { user_id: req.user.id };

        if (q) {
            fileWhere.name = { [Op.like]: `%${q}%` };
            folderWhere.name = { [Op.like]: `%${q}%` };
        }

        if (type) {
            fileWhere.extension = type;
        }

        if (folderId) {
            fileWhere.folder_id = folderId;
            folderWhere.parent_id = folderId;
        }

        if (favorite !== undefined) {
            fileWhere.is_favorite = favorite === 'true' || favorite === true;
        }

        if (from || to) {
            fileWhere.created_at = {};
            folderWhere.created_at = {};
            if (from) {
                fileWhere.created_at[Op.gte] = new Date(from);
                folderWhere.created_at[Op.gte] = new Date(from);
            }
            if (to) {
                fileWhere.created_at[Op.lte] = new Date(to);
                folderWhere.created_at[Op.lte] = new Date(to);
            }
        }

        const includeTags = [];
        if (tag) {
            includeTags.push({
                model: Tag,
                as: 'tags',
                where: { name: tag },
                through: { attributes: [] }
            });
        }

        let files = { rows: [], count: 0 };
        let folders = { rows: [], count: 0 };

        files = await File.findAndCountAll({
            where: fileWhere,
            include: includeTags,
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            order: [[sortBy, sortOrder]]
        });

        if (!type && favorite === undefined && !tag) {
            let folderSortBy = sortBy === 'size' ? 'name' : sortBy;
            folders = await Folder.findAndCountAll({
                where: folderWhere,
                limit: parseInt(limit, 10),
                offset: parseInt(offset, 10),
                order: [[folderSortBy, sortOrder]]
            });
        }

        const data = {
            files: files.rows,
            folders: folders.rows,
            pagination: {
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                totalFiles: files.count,
                totalFolders: folders.count
            }
        };

        return successResponse(res, data, 'Search completed successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = { search };