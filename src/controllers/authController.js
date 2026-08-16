const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { User, UserSession, LoginActivity, PasswordReset } = require('../models');
const { File, Folder } = require('../models'); // For stats
const { successResponse, errorResponse } = require('../utils/response');
const { ConflictError, UnauthorizedError, NotFoundError } = require('../utils/errors');
const { Op } = require('sequelize');

const register = async (req, res, next) => {
  try {
    const { username, email, password, full_name } = req.body;
    
    const existing = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });

    if (existing) {
      if (existing.email === email) throw new ConflictError('Email already in use');
      if (existing.username === username) throw new ConflictError('Username already in use');
    }

    const password_hash = await bcrypt.hash(password, 12);
    
    const user = await User.create({
      username,
      email,
      password_hash,
      full_name,
      created_at: new Date()
    });

    const userData = user.toJSON();
    delete userData.password_hash;
    
    return successResponse(res, userData, 'User registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return next(new UnauthorizedError('Invalid credentials'));
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      await LoginActivity.create({
        user_id: user.id,
        ip_address: req.ip,
        device: req.headers['user-agent'],
        status: 'failed',
        created_at: new Date()
      });
      return next(new UnauthorizedError('Invalid credentials'));
    }

    req.session.userId = user.id;

    await UserSession.create({
      user_id: user.id,
      session_token: req.sessionID || uuidv4(),
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      is_active: true,
      created_at: new Date(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    await LoginActivity.create({
      user_id: user.id,
      ip_address: req.ip,
      device: req.headers['user-agent'],
      status: 'success',
      created_at: new Date()
    });

    const userData = user.toJSON();
    delete userData.password_hash;

    return successResponse(res, userData, 'Logged in successfully');
  } catch (error) {
    console.log(error)
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    if (req.session) {
      req.session.destroy();
    }
    return successResponse(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = req.user.toJSON();
    delete user.password_hash;
    return successResponse(res, user, 'User retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const { full_name, avatar_url } = req.body;
    
    if (full_name !== undefined) req.user.full_name = full_name;
    if (avatar_url !== undefined) req.user.avatar_url = avatar_url;
    
    await req.user.save();
    
    const user = req.user.toJSON();
    delete user.password_hash;
    
    return successResponse(res, user, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    
    const isMatch = await bcrypt.compare(current_password, req.user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid current password');
    }
    
    const password_hash = await bcrypt.hash(new_password, 12);
    req.user.password_hash = password_hash;
    await req.user.save();
    
    return successResponse(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return successResponse(res, null, 'If email exists, a reset link will be sent');
    }
    
    const token = uuidv4();
    await PasswordReset.create({
      user_id: user.id,
      token,
      expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      created_at: new Date()
    });
    
    return successResponse(res, { token }, 'If email exists, a reset link will be sent');
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, new_password } = req.body;
    
    const resetRecord = await PasswordReset.findOne({
      where: {
        token,
        expires_at: {
          [Op.gt]: new Date()
        }
      }
    });
    
    if (!resetRecord) {
      throw new UnauthorizedError('Invalid or expired reset token');
    }
    
    const user = await User.findByPk(resetRecord.user_id);
    if (!user) throw new NotFoundError('User not found');
    
    const password_hash = await bcrypt.hash(new_password, 12);
    user.password_hash = password_hash;
    await user.save();
    
    await resetRecord.destroy();
    
    return successResponse(res, null, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};


const stats = async (req, res, next) => {
  try {
    let totalFile = File.count({
      where: {
        user_id: req.user.id
      }
    })

    let totalFolder = Folder.count({
      where: {
        user_id: req.user.id
      }
    })

    let response = {
      files: await totalFile,
      folders: await totalFolder
    }

    console.log(response)

    return successResponse(res, response, "Success")
  } catch(error) {
    next(error)
  }
}

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateMe,
  changePassword,
  forgotPassword,
  resetPassword,
  stats
};
