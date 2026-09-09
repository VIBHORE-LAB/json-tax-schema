import { app } from "./app.js";
import { config } from "./config.js";
import { sequelize } from "./database.js";

await sequelize.authenticate();

const server = app.listen(config.PORT, "127.0.0.1", () => {
  console.log(`API running at http://localhost:${config.PORT}/api`);
});

server.on("error", async (error) => {
  console.error("Server startup failed:", error);
  await sequelize.close();
  process.exitCode = 1;
});

let stopping = false;

function shutdown() {
  if (stopping) return;
  stopping = true;

  const timeout = setTimeout(() => process.exit(1), 10000);
  timeout.unref();

  server.close(async () => {
    try {
      await sequelize.close();
    } catch (error) {
      console.error("Shutdown failed:", error);
      process.exitCode = 1;
    } finally {
      clearTimeout(timeout);
    }
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
