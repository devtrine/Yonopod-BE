const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const sharesController = require('../controllers/sharesController');
const { createShareSchema, updateShareSchema, verifySharePasswordSchema } = require('../validators/sharesValidator');

// Public routes
router.get('/public/:token', sharesController.accessPublicShare);
router.post('/public/:token/verify', validate(verifySharePasswordSchema), sharesController.verifySharePassword);
router.get('/public/:token/download', sharesController.downloadSharedFile);

// Private routes
router.use(requireAuth);

router.get('/', sharesController.listShares);
router.post('/', validate(createShareSchema), sharesController.createShare);
router.get('/:id', sharesController.getShare);
router.put('/:id', validate(updateShareSchema), sharesController.updateShare);
router.delete('/:id', sharesController.deleteShare);

module.exports = router;
