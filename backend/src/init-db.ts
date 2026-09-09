import { sequelize } from "./database.js";
import "./models/index.js";
try {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
  console.log("Database initialized");
} catch (error) {
  console.error(error);
} finally {
  await sequelize.close()
}
