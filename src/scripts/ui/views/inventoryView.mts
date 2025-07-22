import { EquipAction } from '../../engine/actions/equipAction.mjs';
import { UnequipAction } from '../../engine/actions/unequipAction.mjs';
import { UseItemAction } from '../../engine/actions/useItemAction.mjs';
import { UseSkillAction } from '../../engine/actions/useSkillAction.mjs';
import { GameEvents } from '../../engine/events.mjs';
import { globalServiceLocator } from '../../engine/serviceLocator.mjs';
import { EquipmentComponent, InventoryComponent, IdentityComponent, TagsComponent } from '../../engine/ecs/components/index.mjs';

export class InventoryView {
    private container: HTMLElement;
    private equippedContainer: HTMLElement;
    private inventoryContainer: HTMLElement;

    constructor() {
        this.container = globalServiceLocator.ui.els['inventoryScreen'];
        this.equippedContainer = globalServiceLocator.ui.els['equippedItemsContainer'];
        this.inventoryContainer = globalServiceLocator.ui.els['inventoryItemsContainer'];

        globalServiceLocator.eventBus.subscribe(GameEvents.ITEM_STATE_CHANGED, () => this.render());
    }

    public async render(): Promise<void> {
        const playerId = globalServiceLocator.state.playerId;
        if (!playerId) return;

        const world = globalServiceLocator.world;
        const equipment = world.getComponent(playerId, EquipmentComponent);
        const inventory = world.getComponent(playerId, InventoryComponent);

        // Render Equipped Items
        this.equippedContainer.innerHTML = '<h3>Equipped</h3>';
        if (equipment) {
            for (const [slot, itemId] of Object.entries(equipment.slots)) {
                const el = document.createElement('div');
                if (itemId) {
                    const itemName = world.getComponent(itemId, IdentityComponent)?.name || 'Unknown Item';
                    el.textContent = `${slot}: ${itemName}`;
                    const unequipBtn = document.createElement('button');
                    unequipBtn.textContent = 'Unequip';
                    unequipBtn.onclick = () => {
                        new UnequipAction(playerId, slot as any).execute(world);
                        this.render();
                    };
                    el.appendChild(unequipBtn);
                } else {
                    el.textContent = `${slot}: (empty)`;
                }
                this.equippedContainer.appendChild(el);
            }
        }

        // Render Inventory Items
        this.inventoryContainer.innerHTML = '<h3>Inventory</h3>';
        if (inventory) {
            for (const itemId of inventory.items) {
                const el = document.createElement('div');
                const itemTags = world.getComponent(itemId, TagsComponent);
                const isUnidentified = itemTags?.tags.has('state:unidentified');
                const itemName = world.getComponent(itemId, IdentityComponent)?.name || 'Unknown Item';

                el.textContent = isUnidentified ? `Unidentified Item` : itemName;

                if (isUnidentified) {
                    const useSkillBtn = document.createElement('button');
                    useSkillBtn.textContent = 'Identify';
                    useSkillBtn.onclick = () => {
                        new UseSkillAction(playerId, 'spellcraft', 'identify_item', itemId).execute(world);
                    };
                    el.appendChild(useSkillBtn);
                } else {
                    const equipBtn = document.createElement('button');
                    equipBtn.textContent = 'Equip';
                    equipBtn.onclick = () => {
                        new EquipAction(playerId, itemId, 'main_hand').execute(world);
                    };
                    el.appendChild(equipBtn);

                    // TODO: Check for 'use' property on item data
                    const useBtn = document.createElement('button');
                    useBtn.textContent = 'Use';
                    useBtn.onclick = () => {
                        new UseItemAction(playerId, itemId).execute(world);
                    };
                    el.appendChild(useBtn);
                }
                
                this.inventoryContainer.appendChild(el);
            }
        }
    }

    public show(): void { this.container.style.display = ''; this.render(); }
    public hide(): void { this.container.style.display = 'none'; }
}
