import { ContentItem } from '../../engine/entities/contentItem.mjs';
import { globalServiceLocator } from '../../engine/serviceLocator.mjs';
import { updateSelectionInfo } from '../uiHelpers.mjs';
import { ClassComponent } from '../../engine/ecs/components/index.mjs';
import { ClassInstance } from '../../engine/ecs/components/classComponent.mjs';
import { EffectManager } from '../../engine/effectManager.mjs';

/**
 * Manages the UI and logic for the class selection step of character creation.
 */
export class ClassSelectionView {
    private container: HTMLElement;

    constructor() {
        this.container = globalServiceLocator.ui.els['classes-selector'];
    }

    /**
     * Renders the list of available classes for the player to choose from.
     * @param content - The main content data object containing all game classes.
     */
    public async render(content: ContentItem): Promise<void> {
        this.container.innerHTML = ""; // Clear previous content
        const classes = content.classes;

        if (!classes) {
            this.container.innerText = "Error: Class content not found.";
            return;
        }

        for (const classKey in classes) {
            if (classKey !== 'type' && classKey !== 'get') {
                const classData = await classes[classKey].get();
                if (!classData) continue;

                const classButton = this.container.ownerDocument.createElement('button');
                classButton.textContent = classData.name;

                // Set the onclick handler for this class button
                classButton.onclick = async () => {
                    const playerId = globalServiceLocator.state.playerId;
                    if (playerId === null) {
                        console.error("Player not initialized during class selection.");
                        return;
                    }

                    const world = globalServiceLocator.world;
                    const classComponent = world.getComponent(playerId, ClassComponent) as ClassComponent;
                    if (!classComponent) return;

                    const effectManager = globalServiceLocator.effectManager;
                    const statCalcSystem = globalServiceLocator.statCalculationSystem;
                    const oldClasses = [...classComponent.classes];

                    const isSelected = classButton.classList.contains('selected');

                    // Deselect all other buttons
                    this.container.querySelectorAll('button').forEach(btn => {
                        btn.classList.remove('selected');
                    });

                    // Remove effects of any old classes
                    for (const oldClass of oldClasses) {
                        await effectManager.removeClassEffects(playerId, oldClass.classId, oldClass.level);
                    }

                    if (isSelected) {
                        // If it was already selected, unselect it
                        classComponent.classes = [];
                        updateSelectionInfo(null);
                    } else {
                        // Otherwise, select it
                        classButton.classList.add('selected');
                        
                        const newClass: ClassInstance = {
                            classId: classData.id,
                            level: 1,
                        };

                        classComponent.classes = [newClass];
                        await effectManager.applyClassEffects(playerId, newClass.classId, newClass.level);
                        
                        // TODO: Set Power System Rules

                        updateSelectionInfo(classData);
                    }

                    // Always recalculate stats after any change
                    await statCalcSystem.recalculateStats(playerId, world);
                };

                // Add an icon if it exists
                if (classData.icon) {
                    const imgElement = this.container.ownerDocument.createElement("img");
                    imgElement.src = classData.icon;
                    classButton.appendChild(imgElement);
                }

                this.container.appendChild(classButton);
            }
        }
    }

    /**
     * Makes the class selection view visible.
     */
    public show(): void {
        this.container.style.display = '';
    }

    /**
     * Hides the class selection view.
     */
    public hide(): void {
        this.container.style.display = 'none';
    }
}
