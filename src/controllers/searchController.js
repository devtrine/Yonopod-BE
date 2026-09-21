const { File, Folder, Tag, Sequelize } = require('../models');
const { successResponse } = require('../utils/response');
const { Op } = Sequelize;

const search = async (req, res, next) => {
    try {
        const {
            q, type, folderId, favorite, from, to, tag, label,
            page, limit, sortBy, sortOrder
        } = req.query; 

        const offset = (page - 1) * limit;

        const fileWhere = { user_id: req.user.id };
        const folderWhere = { user_id: req.user.id };

        if (q) {
            // 🛡️ SECURITY PATCH: Cegah Wildcard Injection SQL (sesuai laporan audit)
            const sanitizedQ = q.replace(/[%_]/g, '\\$&');
            
            fileWhere.name = { [Op.iLike]: `%${sanitizedQ}%` };
            folderWhere.name = { [Op.iLike]: `%${sanitizedQ}%` }; 
        }

        if (type) fileWhere.extension = type;
        if (folderId) folderWhere.parent_id = folderId;

        // Tidak perlu "favorite === 'true'" lagi karena Joi sudah mengubahnya jadi Boolean
        if (favorite !== undefined) {
            fileWhere.is_favorite = favorite; 
        }

        // Tidak perlu "new Date(from)" lagi karena Joi sudah merubahnya jadi Objek Date
        if (from || to) {
            fileWhere.created_at = {};
            folderWhere.created_at = {};
            if (from) {
                fileWhere.created_at[Op.gte] = from;
                folderWhere.created_at[Op.gte] = from;
            }
            if (to) {
                fileWhere.created_at[Op.lte] = to;
                folderWhere.created_at[Op.lte] = to;
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

        // 🚀 Tidak perlu parseInt(limit, 10) lagi
        files = await File.findAndCountAll({
            where: fileWhere,
            include: includeTags,
            limit,
            offset,
            order: [[sortBy, sortOrder]]
        });

        if (!type && favorite === undefined && !tag) {
            let folderSortBy = sortBy === 'size' ? 'name' : sortBy;
            folders = await Folder.findAndCountAll({
                where: folderWhere,
                limit,
                offset,
                order: [[folderSortBy, sortOrder]]
            });
        }

        const data = {
            files: files.rows,
            folders: folders.rows,
            pagination: {
                page,
                limit,
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