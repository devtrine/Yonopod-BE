const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const tagsController = require('../controllers/tagsController');
const { createTagSchema, updateTagSchema, listTagsQuery } = require('../validators/tagsValidator');

router.use(requireAuth);

router.get('/', validate(listTagsQuery, 'query'), tagsController.listTags);
router.post('/', validate(createTagSchema), tagsController.createTag);
router.put('/:id', validate(updateTagSchema), tagsController.updateTag);
router.delete('/:id', tagsController.deleteTag);
router.post('/:id/files/:fileId', tagsController.addTagToFile);
router.delete('/:id/files/:fileId', tagsController.removeTagFromFile);
router.get('/:id/files', tagsController.getFilesByTag);

module.exports = router;
