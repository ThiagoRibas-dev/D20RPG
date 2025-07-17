import { Action } from "../actions/action.mjs";
import { Entity } from "../entities/entity.mjs";

export interface AIBehavior {
    evaluate(entity: Entity, context: any): number;
    execute(entity: Entity, context: any): Action;
}
