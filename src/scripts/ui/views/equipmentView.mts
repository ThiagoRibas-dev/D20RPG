import { ContentItem } from '../../engine/entities/contentItem.mjs';
import { globalServiceLocator } from '../../engine/serviceLocator.mjs';
import { updateSelectionInfo } from '../uiHelpers.mjs';
import { InventoryComponent } from '../../engine/ecs/components/index.mjs';

export class EquipmentView {
    private container: HTMLElement;

    constructor() {
        this.container = globalServiceLocator.ui.els['equipment-selector'];
    }

    public async render(content: ContentItem): Promise<void> {
        this.container.innerHTML = ""; // Clear previous content
        const items = content.items;

        if (!items) {
            this.container.innerText = "Error: Item content not found.";
            return;
        }

        for (const itemKey in items) {
            if (itemKey !== 'type' && itemKey !== 'get') {
                const itemData = await items[itemKey].get();
                if (!itemData) continue;

                const itemButton = this.container.ownerDocument.createElement('button');
                itemButton.textContent = itemData.name;

                itemButton.onclick = async () => {
                    const playerId = globalServiceLocator.state.playerId;
                    if (playerId === null) {
                        console.error("Player not initialized during equipment selection.");
                        return;
                    }

                    // For now, just add the item to the inventory.
                    // A real implementation would handle starting gold.
                    const world = globalServiceLocator.world;
                    const lootFactory = globalServiceLocator.lootFactory;
                    const itemEntityId = await lootFactory.createItem(itemData.id);
                    if (itemEntityId) {
                        const inventory = world.getComponent(playerId, InventoryComponent) as InventoryComponent;
                        if (inventory) {
                            inventory.items.push(itemEntityId);
                        }
                    }

                    updateSelectionInfo(itemData);
                };

                this.container.appendChild(itemButton);
            }
        }
    }

    public show(): void {
        this.container.style.display = '';
    }

    public hide(): void {
        this.container.style.display = 'none';
    }
}
