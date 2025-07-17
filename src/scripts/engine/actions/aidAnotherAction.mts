import { Entity } from '../entities/entity.mjs';
import { Action, ActionType } from './action.mjs';
import { globalServiceLocator } from '../serviceLocator.mjs';
import { Point } from '../../utils/point.mjs';
import { getAdjacentEntities, rollD20 } from '../utils.mjs';

export class AidAnotherAction extends Action {
    public readonly id = 'aid_another';
    public readonly name = 'Aid Another';
    public readonly description = 'Help an ally, giving them a +2 bonus on their next attack roll or to their AC against the next attack.';
    public readonly cost: ActionType = ActionType.Standard;

    constructor(actor: Entity) {
        super(actor);
        this.provokesAoO = true;
    }

    public canExecute(): boolean {
        if (!this.actor.actionBudget.hasAction(ActionType.Standard)) {
            return false;
        }
        // Check if there is at least one adjacent ally who is threatened by an opponent.
        const adjacentAllies = getAdjacentEntities(this.actor.position)
            .filter((e: Entity) => e.id !== this.actor.id); // Add logic for faction check later

        return adjacentAllies.some((ally: Entity) =>
            getAdjacentEntities(ally.position)
                .some((e: Entity) => e.id !== ally.id) // Add logic for faction check later
        );
    }

    public async execute(target?: Entity | Point): Promise<void> {
        if (!(target instanceof Entity)) {
            console.error("Aid Another requires a valid entity (ally) to target.");
            return;
        }

        const opponent = this.findOpponentThreatening(target);
        if (!opponent) {
            console.error(`Could not find an opponent threatening the target ally ${target.name}.`);
            return;
        }

        console.log(`${this.actor.name} attempts to Aid Another for ${target.name} against ${opponent.name}.`);

        const attackRoll = rollD20(); // No bonuses for this roll
        if (attackRoll >= 10) {
            console.log("Aid Another successful!");
            // For now, we'll default to giving the AC bonus.
            // A real implementation would require a UI choice.
            globalServiceLocator.effectManager.triggerEffect(
                'eff_aid_another_ac', // This effect will need to be created
                this.actor,
                target
            );
        } else {
            console.log("Aid Another failed.");
        }

        this.actor.actionBudget.standard -= 1;
    }

    private findOpponentThreatening(ally: Entity): Entity | null {
        // Simplified logic: find the first adjacent "hostile" entity.
        return getAdjacentEntities(ally.position)
            .find((e: Entity) => e.id !== ally.id) || null; // Add faction check later
    }
}
