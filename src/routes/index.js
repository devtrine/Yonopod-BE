const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const filesRoutes = require('./files');
const foldersRoutes = require('./folders');
const tagsRoutes = require('./tags');
const favoritesRoutes = require('./favorites');
const recentRoutes = require('./recent');
const searchRoutes = require('./search');
const notificationsRoutes = require('./notifications');

router.use('/auth', authRoutes);
router.use('/files', filesRoutes);
router.use('/folders', foldersRoutes);
router.use('/tags', tagsRoutes);
router.use('/favorites', favoritesRoutes);
router.use('/recent', recentRoutes);
router.use('/search', searchRoutes);
router.use('/notifications', notificationsRoutes);

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Yono API v1',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
