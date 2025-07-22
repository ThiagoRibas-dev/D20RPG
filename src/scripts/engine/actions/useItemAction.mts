import { Action, ActionType } from "./action.mjs";
import { globalServiceLocator } from "../serviceLocator.mjs";
import { EntityID, World } from "../ecs/world.mjs";
import { IdentityComponent, InventoryComponent } from "../ecs/components/index.mjs";

export class UseItemAction extends Action {
    public readonly cost: ActionType = ActionType.Standard;
    public readonly id: string;
    public readonly name: string;
    public readonly description: string;

    private readonly item: EntityID;

    constructor(actor: EntityID, item: EntityID) {
        super(actor);
        this.item = item;
        const itemIdentity = globalServiceLocator.world.getComponent(item, IdentityComponent);
        this.id = `use-item-${itemIdentity?.name}`;
        this.name = `Use ${itemIdentity?.name}`;
        this.description = `Use the ${itemIdentity?.name} item.`;

        // TODO: Read provokesAoO from item data
    }

    canExecute(world: World): boolean {
        const inventory = world.getComponent(this.actor, InventoryComponent) as InventoryComponent;
        return inventory ? inventory.items.includes(this.item) : false;
    }

    public async execute(world: World): Promise<void> {
        const actorIdentity = world.getComponent(this.actor, IdentityComponent);
        const itemIdentity = world.getComponent(this.item, IdentityComponent);
        console.log(`${actorIdentity?.name} uses ${itemIdentity?.name}`);

        // TODO: Read effects_on_use from item data
        // if (this.item.itemData.effects_on_use) {
        //     for (const effectId of this.item.itemData.effects_on_use) {
        //         await globalServiceLocator.effectManager.applyEffect(effectId, this.actor, this.item.toString());
        //     }
        // }

        globalServiceLocator.eventBus.publish("action:use", { action: this });
        return Promise.resolve();
    }
}
