import { Entity } from "../entities/entity.mjs";
import { Action, ActionType } from "./action.mjs";
import { ItemInstance } from "../components/itemInstance.mjs";
import { globalServiceLocator } from "../serviceLocator.mjs";

export class UseSkillAction extends Action {
    public readonly cost: ActionType = ActionType.Standard;
    private readonly skillId: string;
    private readonly useId: string;
    private readonly target: ItemInstance | Entity;

    constructor(actor: Entity, skillId: string, useId: string, target: ItemInstance | Entity) {
        super(actor);
        this.skillId = skillId;
        this.useId = useId;
        this.target = target;
    }

    public execute(): void {
        const targetName = this.target instanceof ItemInstance ? this.target.itemData.name : this.target.name;
        console.log(`${this.actor.name} uses skill ${this.skillId} (${this.useId}) on ${targetName}`);
        globalServiceLocator.rulesEngine.resolveSkillUse(this.actor, this.skillId, this.useId, this.target);
        globalServiceLocator.eventBus.publish("action:use-skill", {action: this});
    }
}
