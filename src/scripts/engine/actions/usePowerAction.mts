import { Entity } from "../entities/entity.mjs";
import { Action, ActionType } from "./action.mjs";
import { GameEvents } from "../events.mjs";
import { globalServiceLocator } from "../serviceLocator.mjs";
import { ContentItem } from "../entities/contentItem.mjs";
import { EntityPosition } from "../utils.mjs";

export type PowerTarget = Entity | Entity[] | EntityPosition;

export class UsePowerAction extends Action {
    public readonly cost: ActionType;

    constructor(
        actor: Entity,
        private power: ContentItem,
        private target: PowerTarget,
        public castOnDefensive: boolean = false,
        public isTouch: boolean = false
    ) {
        super(actor);
        this.cost = this.getCostFromPower(power);
    }

    public execute(): void {
        globalServiceLocator.eventBus.publish(GameEvents.ACTION_USE_POWER_DECLARED, {
            actor: this.actor,
            power: this.power,
            target: this.target
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
