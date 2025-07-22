import { ContentItem } from '../../engine/entities/contentItem.mjs';
import { globalServiceLocator } from '../../engine/serviceLocator.mjs';
import { updateSelectionInfo } from '../uiHelpers.mjs';
import { IdentityComponent } from '../../engine/ecs/components/index.mjs';
import { EffectManager } from '../../engine/effectManager.mjs';

export class RaceSelectionView {
    private container: HTMLElement;

    constructor() {
        this.container = globalServiceLocator.ui.els['races-selector'];
    }

    public async render(content: ContentItem): Promise<void> {
        this.container.innerHTML = ""; // Clear previous content
        const races = content.races;

        if (!races) {
            this.container.innerText = "Error: Race content not found.";
            return;
        }

        for (const raceKey in races) {
            if (raceKey !== 'type' && raceKey !== 'get') {
                const raceItem = races[raceKey] as ContentItem;
                if (raceItem && raceItem.get) {
                    const raceData = await raceItem.get();
                    if (!raceData) continue;

                    const raceButton = this.container.ownerDocument.createElement('button');
                    raceButton.textContent = raceData.name;

                    raceButton.onclick = async () => {
                        const playerId = globalServiceLocator.state.playerId;
                        if (!playerId) {
                            console.error("Player id not initialized during race selection.");
                            return;
                        }

                        const world = globalServiceLocator.world;
                        const identity = world.getComponent(playerId, IdentityComponent);
                        if (!identity) {
                            console.error("Player not initialized during race selection.");
                            return;
                        }

                        const effectManager = globalServiceLocator.effectManager;
                        const statCalcSystem = globalServiceLocator.statCalculationSystem;
                        const oldRaceId = identity.raceId;

                        const isSelected = raceButton.classList.contains('selected');

                        this.container.querySelectorAll('button').forEach(btn => {
                            btn.classList.remove('selected');
                        });

                        // Remove effects of the old race if one was selected
                        if (oldRaceId) {
                            await effectManager.removeRaceEffects(playerId, oldRaceId);
                        }

                        if (isSelected) {
                            identity.raceId = '';
                            updateSelectionInfo(null);
                        } else {
                            raceButton.classList.add('selected');
                            identity.raceId = raceData.id;
                            await effectManager.applyRaceEffects(playerId, raceData.id);
                            updateSelectionInfo(raceData);
                        }

                        // Always recalculate stats after any change
                        await statCalcSystem.recalculateStats(playerId, world);
                    };

                    if (raceData.icon) {
                        const imgElement = this.container.ownerDocument.createElement("img");
                        imgElement.src = raceData.icon;
                        raceButton.appendChild(imgElement);
                    }

                    this.container.appendChild(raceButton);
                }
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
