import {
  DataTypes,
  Model,
} from "sequelize";

import { sequelize } from "../database.js";

export interface PageInfo {
  page: number;
  width: number;
  height: number;
}

interface TemplateAttributes {
  id: string;
  name: string;
  taxYear: number;
  sourceKey: string;
  sourceSha256: string;
  sourceBytes: Buffer | null;
  pages: PageInfo[];
}

export class Template extends Model<
  TemplateAttributes,
  TemplateAttributes
> {
  declare id: string;
  declare name: string;
  declare taxYear: number;
  declare sourceKey: string;
  declare sourceSha256: string;
  declare sourceBytes: Buffer | null;
  declare pages: PageInfo[];
}

Template.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    taxYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    sourceKey: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    sourceSha256: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },

    sourceBytes: {
      type: DataTypes.BLOB("long"),
      allowNull: true,
    },

    pages: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "templates",
    modelName: "Template",
  },
);
