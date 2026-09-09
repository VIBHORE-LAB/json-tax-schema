import { DataTypes, Model, } from "sequelize";
import { sequelize } from "../database.js";
export class Template extends Model {
}
Template.init({
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
    pages: {
        type: DataTypes.JSONB,
        allowNull: false,
    },
}, {
    sequelize,
    tableName: "templates",
    modelName: "Template",
});
