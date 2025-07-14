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

                    const alreadySelectedIndex = player.feats.findIndex(f => f.name === featData.name);

                    if (alreadySelectedIndex !== -1) {
                        // Deselect the feat
                        player.feats.splice(alreadySelectedIndex, 1);
                        featButton.classList.remove('selected');
                        this.updateFeatMessage(`Feat '${featData.name}' deselected.`);
                        updateSelectionInfo({ name: "", description: "" }); // Clear description
                    } else {
                        // Select the feat
                        const maxFeats = 1 + player.modifiers.getValue('feats.max', 0);
                        if (player.feats.length >= maxFeats) {
                            this.updateFeatMessage(`Cannot select more feats. Maximum reached (${maxFeats}).`);
                            return;
                        }

                        if (globalServiceLocator.rulesEngine.validateFeatPrerequisites(player, featData)) {
                            player.feats.push(featData);
                            featButton.classList.add('selected');
                            this.updateFeatMessage(`Feat '${featData.name}' selected.`);
                            updateSelectionInfo(featData);
                        } else {
                            this.updateFeatMessage(`Prerequisites not met for feat: ${featData.name}.`);
                        }
                    }
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
