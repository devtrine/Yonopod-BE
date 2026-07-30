const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const favoritesController = require('../controllers/favoritesController');
const { addFavoriteSchema, listFavoritesQuery } = require('../validators/favoritesValidator');

router.use(requireAuth);

router.get('/', validate(listFavoritesQuery, 'query'), favoritesController.listFavorites);
router.post('/', validate(addFavoriteSchema), favoritesController.addFavorite);
router.delete('/:id', favoritesController.removeFavorite);

module.exports = router;
