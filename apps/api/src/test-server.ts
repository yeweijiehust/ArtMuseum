import { createApp } from "./app.js";

const app = await createApp({
  config: {
    nodeEnv: "test",
    dataStore: "memory",
    storageDriver: "fake",
    port: Number(process.env.PORT ?? 0),
    host: process.env.HOST ?? "127.0.0.1",
    jwtSecret: "test-jwt-secret-test-jwt-secret",
    cookieSecret: "test-cookie-secret-test-cookie-secret",
    enableApiDocs: true
  }
});

const address = await app.listen({
  host: app.config.host,
  port: app.config.port
});

process.stdout.write(`ARTMUSEUM_TEST_SERVER_READY ${address}\n`);

const shutdown = async () => {
  await app.close();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
