const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

module.exports = (sequelize) => {
  const store = new SequelizeStore({
    db: sequelize,
  });

  return session({
    secret: process.env.SESSION_SECRET || 'secret',
    store: store,
    name: process.env.SESSION_COOKIE_NAME || 'yono_token_t1',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    }
  });
};
