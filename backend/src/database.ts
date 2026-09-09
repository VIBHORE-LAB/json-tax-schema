import { Sequelize } from "sequelize";
import pg from "pg";
import { config } from "./config.js";

export const sequelize = new Sequelize(config.DATABASE_URL, {
  dialect: "postgres",
  dialectModule: pg,
  logging: false,

  pool: {
    max: 2,
    min: 0,
    acquire: 10000,
    idle: 10000,
  },

  define: {
    underscored: true,
    timestamps: true
  }
});
