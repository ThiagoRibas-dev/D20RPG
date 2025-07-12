import { EquipAction } from '../../engine/actions/equipAction.mjs';
import { UnequipAction } from '../../engine/actions/unequipAction.mjs';
import { UseItemAction } from '../../engine/actions/useItemAction.mjs';
import { UseSkillAction } from '../../engine/actions/useSkillAction.mjs';
import { GameEvents } from '../../engine/events.mjs';
import { globalServiceLocator } from '../../engine/serviceLocator.mjs';

export class InventoryView {
    private container: HTMLElement; // You'll need to add a div with id="inventoryScreen" to index.html
    private equippedContainer: HTMLElement;
    private inventoryContainer: HTMLElement;

    constructor() {
        // Add these elements to your index.html and getUiScreens()
        this.container = globalServiceLocator.ui.els['inventoryScreen'];
        this.equippedContainer = globalServiceLocator.ui.els['equippedItemsContainer'];
        this.inventoryContainer = globalServiceLocator.ui.els['inventoryItemsContainer'];

        globalServiceLocator.eventBus.subscribe(GameEvents.ITEM_STATE_CHANGED, () => this.render());
    }

    public render(): void {
        const player = globalServiceLocator.state.player;
        if (!player) return;

        // Render Equipped Items
        this.equippedContainer.innerHTML = '<h3>Equipped</h3>';
        for (const [slot, item] of Object.entries(player.equipment.slots)) {
            const el = document.createElement('div');
            if (item) {
                el.textContent = `${slot}: ${item.itemData.name}`;
                const unequipBtn = document.createElement('button');
                unequipBtn.textContent = 'Unequip';
                unequipBtn.onclick = () => {
                    // This assumes processAction exists on PlayerTurnController
                    // and can handle these new actions. You will need to add that.
                    new UnequipAction(player, slot as any).execute();
                    this.render(); // Re-render after action
                };
                el.appendChild(unequipBtn);
            } else {
                el.textContent = `${slot}: (empty)`;
            }
            this.equippedContainer.appendChild(el);
        }

        // Render Inventory Items
        this.inventoryContainer.innerHTML = '<h3>Inventory</h3>';
        player.inventory.items.forEach(item => {
            const el = document.createElement('div');
            const isUnidentified = item.itemData.tags?.includes('state:unidentified');

            el.textContent = isUnidentified ? `Unidentified ${item.itemData.base_id}` : item.itemData.name;

            if (isUnidentified) {
                const useSkillBtn = document.createElement('button');
                useSkillBtn.textContent = 'Identify';
                useSkillBtn.onclick = () => {
                    new UseSkillAction(player, 'spellcraft', 'identify_item', item).execute();
                    // No need to call render() here, the event listener will do it.
                };
                el.appendChild(useSkillBtn);
            } else {
                // Only show Equip and Use buttons for identified items
                const equipBtn = document.createElement('button');
                equipBtn.textContent = 'Equip';
                equipBtn.onclick = () => {
                    new EquipAction(player, item, 'main_hand').execute();
                };
                el.appendChild(equipBtn);

                if (item.itemData.use) {
                    const useBtn = document.createElement('button');
                    useBtn.textContent = 'Use';
                    useBtn.onclick = () => {
                        new UseItemAction(player, item).execute();
                    };
                    el.appendChild(useBtn);
                }
            }
            
            this.inventoryContainer.appendChild(el);
        });
    }

    public show(): void { this.container.style.display = ''; this.render(); }
    public hide(): void { this.container.style.display = 'none'; }
}
