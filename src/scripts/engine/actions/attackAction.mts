import { Entity } from '../entities/entity.mjs';
import { globalServiceLocator } from '../serviceLocator.mjs';
import { Action } from './action.mjs';

export class AttackAction implements Action {
    constructor(private attacker: Entity, private target: Entity) { }

    execute(): void {
        console.log(`${this.attacker.name} performs AttackAction on ${this.target.name}.`);
        // The action itself is now responsible for publishing the first event.
        globalServiceLocator.eventBus.publish('action:attack:declared', {
            attacker: this.attacker,
            target: this.target
        });
    }
}