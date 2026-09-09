import { DataTypes, Model, } from "sequelize";
import { sequelize } from "../database.js";
export class AnnotationVersion extends Model {
}
AnnotationVersion.init({
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
}, {
    sequelize,
    tableName: "annotation_versions",
    modelName: "AnnotationVersion",
    indexes: [
        {
            unique: true,
            fields: ["template_id", "revision"],
        },
    ],
});
