import { Action, ActionType } from "./action.mjs";
import { GameEvents } from "../events.mjs";
import { globalServiceLocator } from "../serviceLocator.mjs";
import { Point } from "../../utils/point.mjs";
import { EntityID, World } from "../ecs/world.mjs";
import { ActionBudgetComponent } from "../ecs/components/index.mjs";

export class UsePowerAction extends Action {
    public readonly id: string;
    public readonly name: string;
    public readonly description: string;
    public readonly cost: ActionType;

    constructor(
        actor: EntityID,
        private powerId: string,
        public castOnDefensive: boolean = false,
        public isTouch: boolean = false
    ) {
        super(actor);
        this.id = `use_power_${powerId}`;
        this.name = `Use ${powerId}`; // TODO: Get name from content
        this.description = `Use the ${powerId} power.`; // TODO: Get description from content
        this.cost = ActionType.Standard; // TODO: Get cost from content
        this.provokesAoO = true; // Spells and powers generally provoke AoO
    }

    public canExecute(world: World): boolean {
        const budget = world.getComponent(this.actor, ActionBudgetComponent);
        return budget ? budget.standardActions > 0 : false; // TODO: Check cost
    }

    public async execute(world: World, target?: EntityID | Point): Promise<void> {
        globalServiceLocator.eventBus.publish(GameEvents.ACTION_USE_POWER_DECLARED, {
            actor: this.actor,
            powerId: this.powerId,
            target: target,
            castOnDefensive: this.castOnDefensive,
            isTouch: this.isTouch
        });
    }
}
