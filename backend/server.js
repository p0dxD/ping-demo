const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Queue } = require('bullmq');
const IORedis = require('ioredis');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// 1. Setup Socket.io
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// 2. Setup BullMQ Queue
// Connection options for Redis
const connection = { host: 'localhost', port: 6379 };
const pingQueue = new Queue('ping-queue', { connection });

const redisClient = new IORedis(connection); // Ensure you have a redis client instance

// 3. Setup Redis Subscriber (The Bridge)
const redisSubscriber = new IORedis(connection);

// Subscribe to all job update channels
redisSubscriber.psubscribe('job-updates:*');

redisSubscriber.on('pmessage', (pattern, channel, message) => {
  // Channel format: 'job-updates:123'
  const jobId = channel.split(':')[1];
  const data = JSON.parse(message);

  console.log(`Forwarding update for Job ${jobId} to socket room job-${jobId}`);

  // Emit to the specific client listening to this job
  io.to(`job-${jobId}`).emit('ping-progress', data);
});

// 4. API Routes
app.post('/api/start-ping-job', async (req, res) => {
  const { deviceIds } = req.body;
  console.log('Received ping request for:', deviceIds);

  const job = await pingQueue.add('ping-job', { deviceIds });

  // Return the Job ID so frontend can subscribe to it
  res.json({ jobId: job.id });
});

// 5. Socket Connection Handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-job-room', (jobId) => {
    console.log(`Socket ${socket.id} joined room job-${jobId}`);
    socket.join(`job-${jobId}`);
  });
// NEW: Handle Cancellation
  socket.on('cancel-job', async (jobId) => {
    console.log(`Received cancellation request for Job ${jobId}`);
    // Set a flag that expires in 60 seconds (auto-cleanup)
    await redisClient.set(`cancel-signal:${jobId}`, 'true', 'EX', 60);
  });
});

server.listen(4000, () => {
  console.log('Backend Server running on port 4000');
});
