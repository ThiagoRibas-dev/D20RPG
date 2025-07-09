import { EquipAction } from '../../engine/actions/equipAction.mjs';
import { UnequipAction } from '../../engine/actions/unequipAction.mjs';
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
            el.textContent = item.itemData.name;
            const equipBtn = document.createElement('button');
            equipBtn.textContent = 'Equip';
            equipBtn.onclick = () => {
                // TODO: This needs to be smarter. For a sword, it should know to go
                // in 'main_hand'. For armor, 'armor'. For now, we'll hardcode 'main_hand'.
                new EquipAction(player, item, 'main_hand').execute();
                this.render(); // Re-render
            };
            el.appendChild(equipBtn);
            this.inventoryContainer.appendChild(el);
        });
    }

    public show(): void { this.container.style.display = ''; this.render(); }
    public hide(): void { this.container.style.display = 'none'; }
}