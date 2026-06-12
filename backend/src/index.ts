import 'dotenv/config';
import { createApp } from './app';
import { getEnv } from './config/env';

const env = getEnv();
const app = createApp();

app.listen(env.PORT, env.BIND, () => {
  console.log(`SocialPulse API listening on http://${env.BIND}:${env.PORT}`);
});
