const { User } = require('../models');
const { errorResponse } = require('../utils/response');

exports.requireAuth = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    const user = await User.findByPk(req.session.userId);
    
    if (!user || !user.is_active) {
      req.session.destroy();
      return errorResponse(res, 'Unauthorized', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    return errorResponse(res, 'Internal server error during authentication', 500);
  }
};
