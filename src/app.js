require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { sequelize } = require('./models');
const sessionConfig = require('./config/session');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
const sessionMiddleware = sessionConfig(sequelize);
app.sessionMiddleware = sessionMiddleware;
app.use(sessionMiddleware);

app.use('/api/v1', routes);

app.use((req, res, next) => {
  res.status(404).json({status : 'error', message: `Cannot ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    status: 'error',
    message: message
  });
});

// app.use(errorHandler);

module.exports = app;
