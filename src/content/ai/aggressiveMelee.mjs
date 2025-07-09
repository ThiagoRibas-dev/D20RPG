import { MeleeAttackAction } from '../../scripts/engine/actions/meleeAttackAction.mjs';
import { MoveAction } from '../../scripts/engine/actions/moveAction.mjs';
import { PassTurnAction } from '../../scripts/engine/actions/passTurnAction.mjs';
import { ServiceLocator } from '../../scripts/engine/serviceLocator.mjs';

export default class AggressiveMeleeAI {
    constructor(self) {
        this.self = self;
    }

    /**
     * This method is called by the TurnManager on the NPC's turn.
     * Its ONLY job is to return the Action the NPC should perform.
     * It does NOT execute actions or advance the turn.
     */
    decideAction() {
        console.log(`AI for ${this.self.name} is deciding...`);

        const target = ServiceLocator.State.player;
        if (!target || !target.isAlive()) {
            return new PassTurnAction(this.self);
        }

        // If combat isn't active yet, this NPC will start it.
        if (!ServiceLocator.TurnManager.isCombatActive) {
            ServiceLocator.TurnManager.startCombat([this.self, target]);
            // Even though we started combat, we still need to return an action.
            // Let's pass the first turn to let initiative settle.
            return new PassTurnAction(this.self);
        }

        const distance = Math.abs(this.self.position.x - target.position.x) + Math.abs(this.self.position.y - target.position.y);

        if (distance <= 1) {
            // In range: return an attack action.
            const weapon = this.self.getEquippedWeapon();
            return new MeleeAttackAction(this.self, target, weapon);
        } else {
            // Not in range: return a move action towards the target.
            const dx = target.position.x - this.self.position.x;
            const dy = target.position.y - this.self.position.y;

            let moveDirection = { x: 0, y: 0 };
            if (Math.abs(dx) > Math.abs(dy)) {
                moveDirection.x = Math.sign(dx);
            } else {
                moveDirection.y = Math.sign(dy);
            }
            return new MoveAction(this.self, moveDirection);
        }
    }
}