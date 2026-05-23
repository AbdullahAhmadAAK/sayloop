const http = require('http');

const { Server } = require('socket.io');

const { createApp } = require('./app');

const { port, clerkSecretKey } = require('./config/env');
const { corsOrigin } = require('./config/cors');

const { connectWithRetry } = require('./config/database');
const usersRepo = require('./db/users.repo');

const { registerMatchHandlers } = require('./modules/match/match.socket');
const { registerSessionHandlers } = require('./modules/session/session.socket');



const app = createApp();

const server = http.createServer(app);



const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});



app.set('io', io);



io.use(async (socket, next) => {

  if (!clerkSecretKey) {

    console.warn('[socket] CLERK_SECRET_KEY missing — allowing connection in dev only');

    return next();

  }



  const token = socket.handshake.auth?.token;

  if (!token) {

    return next(new Error('Unauthorized'));

  }



  try {

    const { verifyToken } = require('@clerk/clerk-sdk-node');

    const payload = await verifyToken(token, { secretKey: clerkSecretKey });

    const clerkUserId = payload.sub;



    const dbUser = await usersRepo.findByClerkId(clerkUserId);

    if (!dbUser) {

      return next(new Error('User not synced. Complete onboarding first.'));

    }



    socket.clerkUserId = clerkUserId;

    socket.dbUserId = dbUser.id;

    socket.dbUser = dbUser;

    return next();

  } catch (err) {

    console.error('[socket] auth failed', err.message);

    return next(new Error('Unauthorized'));

  }

});



io.on('connection', (socket) => {

  console.log('[socket] connected', socket.id, 'user', socket.dbUserId);

  registerMatchHandlers(io, socket);
  registerSessionHandlers(io, socket);

});



server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[server] Port ${port} is already in use.`);
    console.error('[server] Another backend is still running. Stop it first:');
    console.error(`  netstat -ano | findstr :${port}`);
    console.error('  taskkill /PID <pid> /F\n');
    process.exit(1);
  }
  console.error('[server] HTTP error', err);
  process.exit(1);
});

async function start() {
  await connectWithRetry();

  server.listen(port, () => {
    console.log(`[server] http://localhost:${port}`);
    console.log(`[server] health http://localhost:${port}/api/health`);
    console.log(`[server] socket.io on same port`);

    const { getAllowedOrigins } = require('./config/cors');
    console.log(`[server] CORS origins: ${getAllowedOrigins().join(', ')} (+ localhost:* in dev)`);
  });
}



start().catch((err) => {

  console.error('[server] failed to start', err);

  process.exit(1);

});


