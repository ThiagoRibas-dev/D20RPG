import { Entity } from '../entities/entity.mjs';
import { Action, ActionType } from './action.mjs';
import { globalServiceLocator } from '../serviceLocator.mjs';
import { Point } from '../../utils/point.mjs';

export abstract class OpposedCheckAction extends Action {
    public readonly cost: ActionType = ActionType.Standard;

    constructor(actor: Entity) {
        super(actor);
        this.provokesAoO = true;
    }

    public canExecute(): boolean {
        return this.actor.actionBudget.hasAction(ActionType.Standard);
    }

    public async execute(target?: Entity | Point): Promise<void> {
        if (!(target instanceof Entity)) {
            console.error(`${this.name} action requires a valid entity target.`);
            return;
        }

        console.log(`${this.actor.name} attempts to ${this.name} ${target.name}.`);

        // The RulesEngine will handle the AoO check and the opposed roll.
        const success = await this.resolveOpposedCheck(this.actor, target);

        if (success) {
            console.log(`${this.name} successful!`);
            this.onSuccess(target);
        } else {
            console.log(`${this.name} failed.`);
            this.onFailure(target);
        }

        this.actor.actionBudget.standard -= 1;
    }

    protected abstract resolveOpposedCheck(actor: Entity, target: Entity): Promise<boolean>;
    protected abstract onSuccess(target: Entity): void;
    protected abstract onFailure(target: Entity): void;
}
