const { Worker } = require('bullmq');
const IORedis = require('ioredis');

const connection = { host: 'localhost', port: 6379 };
const redisPublisher = new IORedis(connection);

console.log("Worker started... waiting for jobs.");

const worker = new Worker('ping-queue', async (job) => {
  const { deviceIds } = job.data;
  console.log(`Processing Job ${job.id} with ${deviceIds.length} devices.`);

  for (const deviceId of deviceIds) {
    // --- SIMULATE PING (Replace with real ping logic later) ---
    // Random delay between 500ms and 1500ms
    const delay = Math.floor(Math.random() * 1000) + 500;
    await new Promise(r => setTimeout(r, delay));

    // Random Success/Fail
    const isAlive = Math.random() > 0.2; 
    const status = isAlive ? 'success' : 'failed';
    // ----------------------------------------------------------

    // Publish update to Redis
    const channel = `job-updates:${job.id}`;
    const message = JSON.stringify({ deviceId, status });

    await redisPublisher.publish(channel, message);
    console.log(`Job ${job.id}: Device ${deviceId} -> ${status}`);
  }

}, { connection });
