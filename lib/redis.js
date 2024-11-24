import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL, // Replace with your Redis URL if hosted
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

(async () => {
  await redisClient.connect(); // Connect to Redis
})();

export default redisClient;
