import { ContentItem } from '../entities/contentItem.mjs';
import { Entity } from '../entities/entity.mjs';
import { globalServiceLocator } from '../serviceLocator.mjs';
import { Action, ActionType } from './action.mjs';

export class MeleeAttackAction extends Action {
    public readonly cost: ActionType = ActionType.Standard;
    private target: Entity;
    private weapon: ContentItem;

    constructor(actor: Entity, target: Entity, weapon: ContentItem) {
        super(actor);
        this.target = target;
        this.weapon = weapon;
    }

    public execute(): void {
        console.log(`${this.actor.name} executes MeleeAttackAction on ${this.target.name}`);
        // This is where the event chain begins.
        globalServiceLocator.eventBus.publish('action:attack:declared', {
            attacker: this.actor,
            target: this.target,
            weapon: this.weapon
        });
    }
}