import { Action } from "../../actions/action.mjs";
import { MeleeAttackAction } from "../../actions/meleeAttackAction.mjs";
import { MoveAction } from "../../actions/moveAction.mjs";
import { PassTurnAction } from "../../actions/passTurnAction.mjs";
import { Entity } from "../../entities/entity.mjs";
import { globalServiceLocator } from "../../serviceLocator.mjs";
import { AIBehavior } from "../aiBehavior.mjs";

export class AggressiveMeleeBehavior implements AIBehavior {
    evaluate(entity: Entity, context: any): number {
        if (!context.player || !context.player.isAlive()) {
            return 0;
        }
        // This behavior is always active if there's a player.
        return 10;
    }

    execute(entity: Entity, context: any): Action {
        const target = context.player;

        // If combat isn't active yet, this NPC will start it.
        if (!globalServiceLocator.turnManager.isCombatActive) {
            globalServiceLocator.turnManager.startCombat([entity, target]);
            return new PassTurnAction(entity);
        }

        const distance = Math.abs(entity.position.x - target.position.x) + Math.abs(entity.position.y - target.position.y);

        if (distance <= 1) {
            const weapon = entity.getEquippedWeapon();
            return new MeleeAttackAction(entity, target, weapon);
        } else {
            const dx = target.position.x - entity.position.x;
            const dy = target.position.y - entity.position.y;

            let moveDirection = { x: 0, y: 0 };
            if (Math.abs(dx) > Math.abs(dy)) {
                moveDirection.x = Math.sign(dx);
            } else {
                moveDirection.y = Math.sign(dy);
            }
            return new MoveAction(entity, moveDirection);
        }
    }
}
