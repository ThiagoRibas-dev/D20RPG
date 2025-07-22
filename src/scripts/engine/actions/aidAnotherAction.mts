import { Action, ActionType } from './action.mjs';
import { globalServiceLocator } from '../serviceLocator.mjs';
import { Point } from '../../utils/point.mjs';
import { getAdjacentEntities, rollD20 } from '../utils.mjs';
import { EntityID, World } from '../ecs/world.mjs';
import { ActionBudgetComponent, IdentityComponent, PositionComponent } from '../ecs/components/index.mjs';

export class AidAnotherAction extends Action {
    public readonly id = 'aid_another';
    public readonly name = 'Aid Another';
    public readonly description = 'Help an ally, giving them a +2 bonus on their next attack roll or to their AC against the next attack.';
    public readonly cost: ActionType = ActionType.Standard;

    constructor(actor: EntityID) {
        super(actor);
        this.provokesAoO = true;
    }

    public canExecute(world: World): boolean {
        const budget = world.getComponent(this.actor, ActionBudgetComponent);
        if (!budget || budget.standardActions <= 0) {
            return false;
        }

        // Check if there is at least one adjacent ally who is threatened by an opponent.
        const adjacentAllies = getAdjacentEntities(this.actor)
            .filter((e: EntityID) => e !== this.actor); // Add logic for faction check later

        return adjacentAllies.some((allyId: EntityID) => {
            return getAdjacentEntities(allyId)
                .some((e: EntityID) => e !== allyId); // Add logic for faction check later
        });
    }

    public async execute(world: World, targetId?: EntityID | Point): Promise<void> {
        if (typeof targetId !== 'string') {
            console.error("Aid Another requires a valid entity (ally) to target.");
            return;
        }

        const opponent = this.findOpponentThreatening(world, targetId);
        const actorIdentity = world.getComponent(this.actor, IdentityComponent);
        const targetIdentity = world.getComponent(targetId, IdentityComponent);

        if (!opponent) {
            console.error(`Could not find an opponent threatening the target ally ${targetIdentity?.name}.`);
            return;
        }

        const opponentIdentity = world.getComponent(opponent, IdentityComponent);
        console.log(`${actorIdentity?.name} attempts to Aid Another for ${targetIdentity?.name} against ${opponentIdentity?.name}.`);

        const attackRoll = rollD20(); // No bonuses for this roll
        if (attackRoll >= 10) {
            console.log("Aid Another successful!");
            // For now, we'll default to giving the AC bonus.
            // A real implementation would require a UI choice.
            await globalServiceLocator.effectManager.applyEffect(
                'eff_aid_another_ac', // This effect will need to be created
                targetId,
                `entity:${this.actor}`
            );
        } else {
            console.log("Aid Another failed.");
        }

        const budget = world.getComponent(this.actor, ActionBudgetComponent);
        if (budget) {
            budget.standardActions--;
        }
    }

    private findOpponentThreatening(world: World, allyId: EntityID): EntityID | null {
        // Simplified logic: find the first adjacent "hostile" entity.
        return getAdjacentEntities(allyId)
            .find((e: EntityID) => e !== allyId) || null; // Add faction check later
    }
}
