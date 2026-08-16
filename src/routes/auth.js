const express = require('express');
const { requireAuth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { 
  registerSchema, loginSchema, updateProfileSchema, 
  changePasswordSchema, forgotPasswordSchema, resetPasswordSchema 
} = require('../validators/authValidator');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, authController.getMe);
router.get('/stats', requireAuth, authController.stats)
router.put('/me', requireAuth, validate(updateProfileSchema), authController.updateMe);
router.put('/me/password', requireAuth, validate(changePasswordSchema), authController.changePassword);

// kayanya ga sekarang.
// router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
// router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

module.exports = router;
