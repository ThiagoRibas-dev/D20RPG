import { ContentItem } from '../entities/contentItem.mjs';
import { Entity } from '../entities/entity.mjs';
import { GameEvents } from '../events.mjs';
import { globalServiceLocator } from '../serviceLocator.mjs';
import { Action, ActionType } from './action.mjs';
import { Point } from '../../utils/point.mjs';

export class MeleeAttackAction extends Action {
    public readonly id = 'melee_attack';
    public readonly name = 'Melee Attack';
    public readonly description = 'Make a melee attack against an adjacent opponent.';
    public readonly cost: ActionType = ActionType.Standard;
    private target: Entity;
    private weapon: ContentItem;

    constructor(actor: Entity, target: Entity, weapon: ContentItem) {
        super(actor);
        this.target = target;
        this.weapon = weapon;
    }

    public canExecute(): boolean {
        // A melee attack is always possible if the actor has a standard action.
        // The UI should be responsible for ensuring the target is in range.
        return this.actor.actionBudget.hasAction(ActionType.Standard);
    }

    public async execute(target?: Entity | Point): Promise<void> {
        const finalTarget = target || this.target;
        if (!(finalTarget instanceof Entity)) {
            console.error("Melee attack requires a valid entity target.");
            return;
        }

        console.log(`${this.actor.name} executes MeleeAttackAction on ${finalTarget.name}`);
        // This is where the event chain begins.
        globalServiceLocator.eventBus.publish(GameEvents.ACTION_ATTACK_DECLARED, {
            attacker: this.actor,
            target: finalTarget,
            weapon: this.weapon
        });
    }
}
