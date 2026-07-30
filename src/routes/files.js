const express = require('express');
const { requireAuth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { 
  presignUploadSchema, confirmUploadSchema, 
  updateFileSchema, listFilesQuery 
} = require('../validators/filesValidator');
const filesController = require('../controllers/filesController');

const router = express.Router();

router.use(requireAuth);

router.get('/', validate(listFilesQuery, 'query'), filesController.listFiles);
router.get('/trash', filesController.listTrash);
router.get('/:id', filesController.getFile);
router.post('/presign-upload', validate(presignUploadSchema), filesController.presignUpload);
// router.post('/confirm-upload', validate(confirmUploadSchema), filesController.confirmUpload);
router.get('/:id/download', filesController.downloadFile);
router.put('/:id', validate(updateFileSchema), filesController.updateFile);
router.delete('/:id', filesController.softDelete);
router.post('/:id/restore', filesController.restore);
router.delete('/:id/permanent', filesController.permanentDelete);

module.exports = router;
