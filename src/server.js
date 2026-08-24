const http = require('http');
const app = require('./app');
const { sequelize } = require('./models');
const { initWebSocket } = require('./utils/websocket');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    if (sequelize.models.Session) {
      await sequelize.models.Session.sync();
    }

    const server = http.createServer(app);
    initWebSocket(server, app.sessionMiddleware);

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

startServer();

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
