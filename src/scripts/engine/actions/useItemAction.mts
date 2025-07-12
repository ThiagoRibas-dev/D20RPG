import { Entity } from "../entities/entity.mjs";
import { Action, ActionType } from "./action.mjs";
import { ItemInstance } from "../components/itemInstance.mjs";
import { globalServiceLocator } from "../serviceLocator.mjs";

export class UseItemAction extends Action {
    public readonly cost: ActionType = ActionType.Standard;
    private readonly item: ItemInstance;

    constructor(actor: Entity, item: ItemInstance) {
        super(actor);
        this.item = item;
        if (item.itemData.activation?.provokesAoO) {
            this.provokesAoO = true;
        }
    }

    public execute(): void {
        console.log(`${this.actor.name} uses ${this.item.itemData.name}`);
        
        if (this.item.itemData.effects_on_use) {
            for (const effectId of this.item.itemData.effects_on_use) {
                globalServiceLocator.effectManager.triggerEffect(effectId, this.actor, this.item);
            }
        }

        globalServiceLocator.eventBus.publish("action:use", {action: this});
    }
}
