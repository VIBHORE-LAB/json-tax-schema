import {
  DataTypes,
  Model,
  type Optional,
} from "sequelize";

import { sequelize } from "../database.js";
import type { Annotation } from "../lib/annotation.js";

interface VersionAttributes {
  id: string;
  templateId: string;
  revision: number;
  annotation: Annotation;
}

export class AnnotationVersion extends Model<
  VersionAttributes,
  Optional<VersionAttributes, "id">
> {
  declare id: string;
  declare templateId: string;
  declare revision: number;
  declare annotation: Annotation;
}

AnnotationVersion.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    templateId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "templates",
        key: "id",
      },
    },

    revision: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
    },

    annotation: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "annotation_versions",
    modelName: "AnnotationVersion",

    indexes: [
      {
        unique: true,
        fields: ["template_id", "revision"],
      },
    ],
  },
);
