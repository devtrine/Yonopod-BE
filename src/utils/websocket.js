const { WebSocketServer, WebSocket } = require('ws');

// Store socket connections with Map <user_id, Set<WebSocket>>
const userSockets = new Map();

let wss = null;

/**
 * Initialize WebSocket Server attached to HTTP Server with Express Session authentication
 * @param {import('http').Server} server 
 * @param {Function} sessionMiddleware 
 */
const initWebSocket = (server, sessionMiddleware) => {
  wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    // Only handle websocket connection on /ws (or root if needed)
    const pathname = request.url ? request.url.split('?')[0] : '';
    if (pathname !== '/ws' && pathname !== '/api/v1/ws') {
      // Not our WS endpoint, return or let other handlers process
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      socket.destroy();
      return;
    }

    // Fake response object required by express-session middleware
    const res = {
      writeHead: () => {},
      setHeader: () => {},
      getHeader: () => {},
      end: () => {},
      on: () => {},
      once: () => {},
      emit: () => {}
    };

    sessionMiddleware(request, res, () => {
      // Check if session has authenticated userId
      const userId = request.session ? request.session.userId : null;

      if (!userId) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    });
  });

  wss.on('connection', (ws, request) => {
    const userId = request.session ? request.session.userId : null;
    if (!userId) {
      ws.close(4001, 'Unauthorized');
      return;
    }

    // Register socket in Map <user_id, Set<WebSocket>>
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(ws);

    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (message) => {
      try {
        const parsed = JSON.parse(message.toString());
        if (parsed.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        }
      } catch (err) {
        console.log(err)
        // Ignore non-json or unhandled messages
      }
    });

    const cleanup = () => {
      if (userSockets.has(userId)) {
        const sockets = userSockets.get(userId);
        sockets.delete(ws);
        if (sockets.size === 0) {
          userSockets.delete(userId);
        }
      }
    };

    ws.on('close', cleanup);
    ws.on('error', cleanup);

    // Send connection established message
    ws.send(JSON.stringify({
      event: 'connected',
      message: 'WebSocket connection established successfully',
      userId: userId,
      timestamp: new Date().toISOString()
    }));
  });

  // Heartbeat interval to check dead connections
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  return wss;
};

/**
 * Send socket event to a specific user
 * @param {string} userId - Target user ID
 * @param {any} data - Data payload to send
 * @returns {boolean} - True if at least one message was sent
 */
const sendSocket = (userId, data) => {
  if (!userSockets.has(userId)) {
    return false;
  }

  const sockets = userSockets.get(userId);
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  let sent = false;

  for (const ws of sockets) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
      sent = true;
    }
  }

  return sent;
};

/**
 * Check if a user is currently connected via WebSocket
 * @param {string} userId 
 * @returns {boolean}
 */
const isUserConnected = (userId) => {
  return userSockets.has(userId) && userSockets.get(userId).size > 0;
};

/**
 * Get map of user sockets (for debugging/monitoring)
 */
const getUserSocketsMap = () => {
  return userSockets;
};

module.exports = {
  initWebSocket,
  sendSocket,
  isUserConnected,
  getUserSocketsMap
};
