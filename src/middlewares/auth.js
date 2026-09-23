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
    const activeSession = await UserSession.findOne({
      where: {
        session_token: req.sessionID,
        is_active: true
      }
    });
    if (!activeSession) {
      req.session.destroy();
      res.clearCookie('connect.sid');
      throw new UnauthorizedError('Your session has expired or was revoked. Please log in again.');
    }

    req.user = user;
    next();
  } catch (error) {
    return errorResponse(res, 'Internal server error during authentication', 500);
  }
};
