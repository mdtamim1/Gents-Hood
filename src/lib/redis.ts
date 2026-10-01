import { Redis } from '@upstash/redis';

const restUrl = process.env.UPSTASH_REDIS_REST_URL;
const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis =
  restUrl && restToken && !restUrl.includes('sample.upstash.io')
    ? new Redis({
        url: restUrl,
        token: restToken,
      })
    : null;

export default redis;
