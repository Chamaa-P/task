const { io } = require('socket.io-client');

const url = process.argv[2] || 'http://localhost:5000';
const userId = Number(process.argv[3] || 1);
const username = process.argv[4] || 'testuser';

console.log(`Connecting to ${url}...`);
const socket = io(url, { transports: ['websocket'], autoConnect: true });

socket.on('connect', () => {
  console.log('Connected to WebSocket server:', socket.id);
  socket.emit('authenticate', { userId, username });
  socket.emit('task:create', { title: 'automated test task', description: 'From ws_test script', createdBy: userId });
});

socket.on('users:online', (users) => {
  console.log('Online users:', users);
});

socket.on('task:created', (task) => {
  console.log('Received task:created event', task);
  socket.disconnect();
  process.exit(0);
});

socket.on('connect_error', (err) => {
  console.error('Connection error', err.message || err);
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
