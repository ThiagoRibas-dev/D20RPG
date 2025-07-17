import { ContentItem } from '../../engine/entities/contentItem.mjs';
import { globalServiceLocator } from '../../engine/serviceLocator.mjs';
import { updateSelectionInfo } from '../uiHelpers.mjs';

/**
 * Manages the UI and logic for the feat selection step of character creation.
 */
export class FeatSelectionView {
    private container: HTMLElement;
    private messageContainer: HTMLElement;

    constructor() {
        this.container = globalServiceLocator.ui.els['feats-selector'];
        this.messageContainer = globalServiceLocator.ui.els['feat-selection-message'];
    }

    /**
     * Renders the list of available feats for the player to choose from.
     * @param content - The main content data object containing all game feats.
     */
    public async render(content: ContentItem): Promise<void> {
        this.container.innerHTML = ""; // Clear previous content
        const feats = content.feats;

        if (!feats) {
            this.container.innerText = "Error: Feat content not found.";
            return;
        }

        for (const featKey in feats) {
            if (featKey !== 'type' && featKey !== 'get') {
                const featData = await feats[featKey].get();
                if (!featData) continue;

                const featButton = this.container.ownerDocument.createElement('button');
                featButton.textContent = featData.name;

                // Set the onclick handler for this feat button
                featButton.onclick = () => {
                    const player = globalServiceLocator.state.player;
                    if (!player) {
                        console.error("Player not initialized during feat selection.");
                        return;
                    }

                    const filledSlotIndex = player.featSlots.findIndex(s => s.feat?.id === featData.id);

                    if (filledSlotIndex !== -1) {
                        // Deselect the feat
                        const slot = player.featSlots[filledSlotIndex];
                        slot.feat = null;
                        featButton.classList.remove('selected');
                        this.updateFeatMessage(`Feat '${featData.name}' deselected.`);
                        updateSelectionInfo({ name: "", description: "" });
                    } else {
                        // Find an empty slot
                        const emptySlot = player.featSlots.find(s => !s.feat);
                        if (!emptySlot) {
                            this.updateFeatMessage(`Cannot select more feats. All slots are full.`);
                            return;
                        }

                        // Check for tag restrictions
                        if (emptySlot.tags.length > 0 && !emptySlot.tags.every(tag => featData.tags.includes(tag))) {
                            this.updateFeatMessage(`This feat does not meet the requirements for the available slot (${emptySlot.tags.join(', ')}).`);
                            return;
                        }

                        if (globalServiceLocator.rulesEngine.validateFeatPrerequisites(player, featData)) {
                            emptySlot.feat = featData;
                            featButton.classList.add('selected');
                            this.updateFeatMessage(`Feat '${featData.name}' selected for slot: ${emptySlot.source}.`);
                            updateSelectionInfo(featData);
                        } else {
                            this.updateFeatMessage(`Prerequisites not met for feat: ${featData.name}.`);
                        }
                    }
                    // Update the main feats array
                    player.feats = player.featSlots.map(s => s.feat).filter(f => f) as ContentItem[];
                };

                this.container.appendChild(featButton);
            }
        }
    }

    private updateFeatMessage(message: string): void {
        this.messageContainer.textContent = message;
        this.messageContainer.style.display = message ? 'block' : 'none';
    }

    public show(): void {
        this.container.style.display = '';
        this.messageContainer.style.display = 'block';
    }

    public hide(): void {
        this.container.style.display = 'none';
        this.messageContainer.style.display = 'none';
    }
}
