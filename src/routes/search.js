const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const searchController = require('../controllers/searchController');
const { searchSchema } = require('../validators/searchValidator');

router.use(requireAuth);

router.get('/', validate(searchSchema), searchController.search);

module.exports = router;