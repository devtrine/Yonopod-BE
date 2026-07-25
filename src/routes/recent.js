const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');
const recentController = require('../controllers/recentController');

router.use(requireAuth);

router.get('/', recentController.listRecent);
router.post('/', recentController.recordAccess);
router.delete('/', recentController.clearHistory);

module.exports = router;
