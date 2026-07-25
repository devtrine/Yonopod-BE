const express = require('express');
const { requireAuth } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { 
  createFolderSchema, updateFolderSchema, 
  lockFolderSchema, unlockFolderSchema, listFoldersQuery 
} = require('../validators/foldersValidator');
const foldersController = require('../controllers/foldersController');

const router = express.Router();

router.use(requireAuth);

router.get('/', validate(listFoldersQuery, 'query'), foldersController.listFolders);
router.get('/trash', foldersController.listTrash);
router.get('/:id', foldersController.getFolder);
router.post('/', validate(createFolderSchema), foldersController.createFolder);
router.put('/:id', validate(updateFolderSchema), foldersController.updateFolder);
router.delete('/:id', foldersController.softDelete);
router.post('/:id/restore', foldersController.restore);
router.delete('/:id/permanent', foldersController.permanentDelete);
router.post('/:id/lock', validate(lockFolderSchema), foldersController.lockFolder);
router.post('/:id/unlock', validate(unlockFolderSchema), foldersController.unlockFolder);

module.exports = router;
