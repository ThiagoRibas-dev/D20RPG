import { Action } from "../../actions/action.mjs";
import { PassTurnAction } from "../../actions/passTurnAction.mjs";
import { Entity } from "../../entities/entity.mjs";
import { AIBehavior } from "../aiBehavior.mjs";

export class IdleBehavior implements AIBehavior {
    evaluate(entity: Entity, context: any): number {
        // Idle is the fallback, so it always has a low score.
        return 1;
    }

    execute(entity: Entity, context: any): Action {
        return new PassTurnAction(entity);
    }
}
