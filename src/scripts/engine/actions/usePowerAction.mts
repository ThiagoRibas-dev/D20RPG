import { Entity } from "../entities/entity.mjs";
import { Action, ActionType } from "./action.mjs";
import { GameEvents } from "../events.mjs";
import { globalServiceLocator } from "../serviceLocator.mjs";
import { ContentItem } from "../entities/contentItem.mjs";
import { Point } from "../../utils/point.mjs";

export class UsePowerAction extends Action {
    public readonly id: string;
    public readonly name: string;
    public readonly description: string;
    public readonly cost: ActionType;

    constructor(
        actor: Entity,
        private power: ContentItem,
        public castOnDefensive: boolean = false,
        public isTouch: boolean = false
    ) {
        super(actor);
        this.id = `use_power_${power.id}`;
        this.name = `Use ${power.name}`;
        this.description = power.description || 'Use a special power or spell.';
        this.cost = this.getCostFromPower(power);
        this.provokesAoO = true; // Spells and powers generally provoke AoO
    }

    public canExecute(): boolean {
        // Basic check. In the future, this could check for spell slots, components, etc.
        return this.actor.actionBudget.hasAction(this.cost);
    }

    public async execute(target?: Entity | Point): Promise<void> {
        globalServiceLocator.eventBus.publish(GameEvents.ACTION_USE_POWER_DECLARED, {
            actor: this.actor,
            power: this.power,
            target: target,
            castOnDefensive: this.castOnDefensive,
            isTouch: this.isTouch
        });
    }

    private getCostFromPower(power: ContentItem): ActionType {
        const castingTime = power.casting_time || 'standard';
        switch (castingTime) {
            case 'standard':
                return ActionType.Standard;
            case 'move':
                return ActionType.Move;
            case 'full-round':
                return ActionType.FullRound;
            case 'swift':
                return ActionType.Swift;
            case 'free':
                return ActionType.Free;
            default:
                return ActionType.Standard;
        }
    }
}
