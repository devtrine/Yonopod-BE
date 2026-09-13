const express = require('express');
const router = express.Router();
const shareController = require('../controllers/shareController');
const { requireAuth } = require('../middlewares/auth');

// 🟢 PUBLIC ROUTE (Orang luar hit URL ini untuk download file)
router.get('/public/:id', shareController.accessPublicShare);

// 🔴 PROTECTED ROUTES (Harus login, untuk manajemen link)
router.use(requireAuth);

router.post('/', shareController.createShare);
router.get('/', shareController.listShares);
router.patch('/:id/terminate', shareController.terminateShare);
router.patch('/:id/unterminate', shareController.unTerminateShare);

module.exports = router;