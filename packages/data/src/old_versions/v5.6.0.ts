import { status } from "@gi-tcg/core/builder";
import { CollectiveOfPlenty } from "../cards/support/place";

/**
 * @id 301025
 * @name 锻炼
 * @description
 * 自身层数到达3时，治疗所附属角色1点；若自身层数等于5，则所附属角色造成的伤害（包括角色引发的扩散伤害）+1。（可叠加，最多叠加到5层）
 */
const Exercise = status(301025)
  .until("v5.6.0")
  .variableCanAppend("layer", 2, 5)
  .on("enter", (c, e) => (e.overridden?.variables.layer ?? 0) < 3 && c.getVariable("layer") >= 3)
  .heal(1, "@master")
  .on("increaseDamage", (c, e) => e.via.caller.definition.type === "character")
  .increaseDamage(1)
  .done();