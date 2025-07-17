import { Entity } from "../entities/entity.mjs";
import { Action, ActionType } from "./action.mjs";
import { ItemInstance } from "../components/itemInstance.mjs";
import { globalServiceLocator } from "../serviceLocator.mjs";

export class UseItemAction extends Action {
    public readonly cost: ActionType = ActionType.Standard;
    public readonly id: string;
    public readonly name: string;
    public readonly description: string;

    private readonly item: ItemInstance;

    constructor(actor: Entity, item: ItemInstance) {
        super(actor);
        this.item = item;
        this.id = `use-item-${item.itemData.id}`;
        this.name = `Use ${item.itemData.name}`;
        this.description = `Use the ${item.itemData.name} item.`;

        if (item.itemData.activation?.provokesAoO) {
            this.provokesAoO = true;
        }
    }

    canExecute(): boolean {
        // Basic check: does the actor have the item?
        return this.actor.inventory.items.some(i => i.instanceId === this.item.instanceId);
    }

    public async execute(): Promise<void> {
        console.log(`${this.actor.name} uses ${this.item.itemData.name}`);

        if (this.item.itemData.effects_on_use) {
            for (const effectId of this.item.itemData.effects_on_use) {
                await globalServiceLocator.effectManager.triggerEffect(effectId, this.actor, this.item);
            }
        }

        globalServiceLocator.eventBus.publish("action:use", { action: this });
        return Promise.resolve();
    }
}
