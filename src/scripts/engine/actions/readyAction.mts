import { Entity } from '../entities/entity.mjs';
import { Action, ActionType } from './action.mjs';
import { globalServiceLocator } from '../serviceLocator.mjs';
import { Point } from '../../utils/point.mjs';

export class ReadyAction extends Action {
    public readonly id = 'ready';
    public readonly name = 'Ready';
    public readonly description = 'Prepare to take an action later in the round.';
    public readonly cost: ActionType = ActionType.Standard;

    private trigger: string = '';
    private readiedAction: Action | null = null;

    constructor(actor: Entity, trigger: string, readiedAction: Action) {
        super(actor);
        this.provokesAoO = false;
        this.trigger = trigger;
        this.readiedAction = readiedAction;
    }

    public canExecute(): boolean {
        return this.actor.actionBudget.hasAction(ActionType.Standard);
    }

    public async execute(target?: Entity | Point): Promise<void> {
        console.log(`${this.actor.name} readies an action.`);

        // In a real implementation, the UI would prompt the player to select
        // a trigger and an action. For now, we assume they are passed in the constructor.

        globalServiceLocator.interruptManager.add({
            actor: this.actor,
            trigger: this.trigger,
            action: this.readiedAction,
        });

        this.actor.actionBudget.standard -= 1;
    }
}
