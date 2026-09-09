import { AnnotationVersion } from "./annotation-version.js";
import { Template } from "./template.js";

Template.hasMany(AnnotationVersion, {
  foreignKey: "templateId",
  as: "versions",
});

AnnotationVersion.belongsTo(Template, {
  foreignKey: "templateId",
  as: "template",
});

export { AnnotationVersion } from "./annotation-version.js";
export { Template } from "./template.js";
export type { PageInfo } from "./template.js";
