import { Action } from "../actions/action.mjs";
import { EntityID, World } from "../ecs/world.mjs";

export interface AIBehavior {
    evaluate(entityId: EntityID, world: World, context: any): number;
    execute(entityId: EntityID, world: World, context: any): Action | null;
}
