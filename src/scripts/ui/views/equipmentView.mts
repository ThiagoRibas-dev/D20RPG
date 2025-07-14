import { ItemInstance } from '../../engine/components/itemInstance.mjs';
import { ContentItem } from '../../engine/entities/contentItem.mjs';
import { globalServiceLocator } from '../../engine/serviceLocator.mjs';
import { updateSelectionInfo } from '../uiHelpers.mjs';

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

                itemButton.onclick = () => {
                    const player = globalServiceLocator.state.player;
                    if (!player) {
                        console.error("Player not initialized during equipment selection.");
                        return;
                    }

                    // For now, just add the item to the inventory.
                    // A real implementation would handle starting gold.
                    const newItem = new ItemInstance(itemData.id, itemData);
                    player.inventory.add(newItem);

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
