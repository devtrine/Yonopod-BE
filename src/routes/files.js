const express = require('express');
const { requireAuth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { 
  presignUploadSchema, 
  s3PresignSchema,
  confirmUploadSchema, 
  updateFileSchema, 
  listFilesQuery 
} = require('../validators/filesValidator');
const filesController = require('../controllers/filesController');

const router = express.Router();

router.use(requireAuth);

// S3 & Uppy v6 Endpoints
router.get('/s3/config', filesController.getS3Config);
router.post('/s3/presign', validate(s3PresignSchema), filesController.s3Presign);
router.post('/confirm-upload', validate(confirmUploadSchema), filesController.confirmUpload);

// File management endpoints
router.get('/', validate(listFilesQuery, 'query'), filesController.listFiles);
router.get('/trash', filesController.listTrash);
router.get('/:id', filesController.getFile);
router.post('/presign-upload', validate(presignUploadSchema), filesController.presignUpload);
router.get('/:id/download', filesController.downloadFile);
router.put('/:id', validate(updateFileSchema), filesController.updateFile);
router.delete('/:id', filesController.softDelete);
router.post('/:id/restore', filesController.restore);
router.delete('/:id/permanent', filesController.permanentDelete);

module.exports = router;
