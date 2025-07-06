import { MeleeAttackAction } from '../../scripts/engine/actions/meleeAttackAction.mjs';
import { ServiceLocator } from '../../scripts/engine/serviceLocator.mjs';

export default class AggressiveMeleeAI {
    constructor(self) {
        this.self = self; // The NPC this AI controls
    }

    /**
     * This method is called by the TurnManager on our NPC's turn.
     */
    decideAndExecuteAction() {
        console.log(`AI for ${this.self.name} is thinking...`);

        // 1. Find a target. (Simple logic: find the player)
        const target = ServiceLocator.State.player;
        if (!target) {
            console.log("AI sees no player. Ending turn.");
            ServiceLocator.TurnManager.advanceTurn(); // End turn if no target
            return;
        }

        // 2. Check if the target is in melee range.
        // (A helper function would be great for this)
        const distance = Math.abs(this.self.position.x - target.position.x) + Math.abs(this.self.position.y - target.position.y);

        if (distance <= 1) { // Assuming adjacent is a distance of 1
            // 3a. If in range, ATTACK.
            console.log(`AI: ${this.self.name} is in range of ${target.name}. Attacking!`);

            // The AI creates the same Action object as the player would.
            const weapon = this.self.getEquippedWeapon();
            const attackAction = new MeleeAttackAction(this.self, target, weapon);

            // The AI submits its action to the same system as the player.
            // NOTE: We do not call processAction here, we would need a dedicated
            // entry point in the TurnManager for NPCs.
            ServiceLocator.TurnManager.performNpcAction(attackAction);

        } else {
            // 3b. If not in range, MOVE closer.
            // We would create a new `MoveAction` class and execute it here.
            console.log(`AI: ${this.self.name} is moving towards ${target.name}.`);
            // const moveAction = new MoveAction(this.self, target.position);
            // ServiceLocator.TurnManager.performNpcAction(moveAction);

            // For now, just end the turn.
            ServiceLocator.TurnManager.advanceTurn();
        }
    }
}