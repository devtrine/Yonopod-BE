const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');
const auditController = require('../controllers/auditController');

router.use(requireAuth); 

router.get('/folders', auditController.listFolderLogs);
router.get('/files', auditController.listFileLogs);

module.exports = router;