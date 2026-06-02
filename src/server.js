const http = require('http');
const { Server } = require('socket.io');
const { createApp, createStore, sanitizeText } = require('./app');

const RESPECT_FILTER = [/blbec/gi, /idiot/gi, /debil/gi, /krava/gi];

function applyRespectFilter(text) {
  let next = text;
  for (const pattern of RESPECT_FILTER) {
    next = next.replace(pattern, '***');
  }
  return next;
}

const store = createStore();
const app = createApp(store);
const server = http.createServer(app);
const io = new Server(server);

io.on('connection', (socket) => {
  const anonId = sanitizeText(socket.handshake.query.anonId || `anon-${Math.random().toString(36).slice(2, 8)}`, 64);

  socket.emit('chat:init', store.chatMessages.slice(-100));

  socket.on('chat:message', (payload = {}) => {
    const text = applyRespectFilter(sanitizeText(payload.text));
    const imageUrl = sanitizeText(payload.imageUrl, 300);

    if (!text && !imageUrl) return;

    const msg = {
      id: store.nextId++,
      anonId,
      text,
      imageUrl,
      createdAt: new Date().toISOString(),
    };
    store.chatMessages.push(msg);
    io.emit('chat:message', msg);
  });
});

const port = Number(process.env.PORT || 3000);
server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Teacher control app is running on http://localhost:${port}`);
});
