import { createApp } from "./app.js";

const app = await createApp();

try {
  await app.listen({
    host: app.config.host,
    port: app.config.port
  });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
