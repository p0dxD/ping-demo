// worker.js
const { Worker } = require('bullmq');
const IORedis = require('ioredis');

const connection = { host: 'localhost', port: 6379 };
const redisPublisher = new IORedis(connection);
const redisClient = new IORedis(connection); // New client for reading flags

console.log("Worker started... waiting for jobs.");

const worker = new Worker('ping-queue', async (job) => {
  const { deviceIds } = job.data;
  console.log(`Starting Job ${job.id}`);

  for (const deviceId of deviceIds) {
    
    // 1. CHECK FOR CANCELLATION SIGNAL
    const isCancelled = await redisClient.get(`cancel-signal:${job.id}`);
    
    if (isCancelled) {
      console.log(`Job ${job.id} was cancelled by user.`);
      // Optional: Tell frontend it was cancelled
      await redisPublisher.publish(`job-updates:${job.id}`, JSON.stringify({ 
        deviceId: 'SYSTEM', 
        status: 'cancelled' 
      }));
      return; // STOP THE LOOP
    }

    // 2. Perform Ping (Simulation)
    const delay = Math.floor(Math.random() * 1000) + 500;
    await new Promise(r => setTimeout(r, delay));

    const isAlive = Math.random() > 0.2; 
    const status = isAlive ? 'success' : 'failed';

    // 3. Publish Result
    await redisPublisher.publish(`job-updates:${job.id}`, JSON.stringify({ deviceId, status }));
  }

  // Cleanup the signal key (optional but good practice)
  await redisClient.del(`cancel-signal:${job.id}`);

}, { connection });