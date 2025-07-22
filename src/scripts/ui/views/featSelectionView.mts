import { ContentLoader } from '../../engine/contentLoader.mjs';
import { FeatsComponent } from '../../engine/ecs/components/featsComponent.mjs';
import { ContentItem } from '../../engine/entities/contentItem.mjs';
import { FeatSlot } from '../../engine/entities/featSlot.mjs';
import { globalServiceLocator } from '../../engine/serviceLocator.mjs';

export class FeatSelectionView {
    // --- UI Elements ---
    private featSelector: HTMLElement;
    private viewElement: HTMLElement;
    private availableFeatsContainer: HTMLElement;
    private featSelectionMessage: HTMLElement;
    private confirmButton: HTMLButtonElement;
    private selectorInfo: HTMLElement;
    private selectedName: HTMLElement;
    private selectedDesc: HTMLElement;

    // --- State Management ---
    private currentSlotIndex: number = 0;
    private unfilledSlots: FeatSlot[] = [];
    private selectedFeat: ContentItem | null = null;
    private selectedFeatElement: HTMLElement | null = null;

    constructor() {
        const ui = globalServiceLocator.ui;
        this.featSelector = ui.els['feats-selector'];
        this.viewElement = ui.els.featSelectionView;
        this.availableFeatsContainer = ui.els.availableFeats;
        this.featSelectionMessage = ui.els['feat-selection-message'];
        this.confirmButton = ui.btns.confirmFeatButton;
        this.selectorInfo = ui.els['selector-info'];
        this.selectedName = ui.els['selected-name'];
        this.selectedDesc = ui.els['selected-desc'];

        if (this.confirmButton) {
            this.confirmButton.addEventListener('click', () => this.confirmFeatSelection());
        }
    }

    // --- Core Lifecycle Methods ---
    public show(): void {
        this.featSelector.style.display = 'block';
        this.viewElement.style.display = 'block';
        this.featSelectionMessage.style.display = 'block';
        this.availableFeatsContainer.style.display = 'block';
        this.reset();
        this.start();
    }

    public hide(): void {
        this.featSelector.style.display = 'none';
        this.viewElement.style.display = 'none';
        this.featSelectionMessage.style.display = 'none';
        this.availableFeatsContainer.style.display = 'none';
        this.updateSelectionInfo(null); // Clean up shared panel
    }

    private reset(): void {
        this.currentSlotIndex = 0;
        this.unfilledSlots = [];
        this.selectedFeat = null;
        if (this.selectedFeatElement) {
            this.selectedFeatElement.classList.remove('selected');
        }
        this.selectedFeatElement = null;
        this.availableFeatsContainer.innerHTML = '';
        this.updateMessage('');
    }

    // --- Wizard Logic ---
    private start(): void {
        const playerId = globalServiceLocator.state.playerId;
        if (!playerId) return;

        const featsComponent = globalServiceLocator.world.getComponent(playerId, FeatsComponent);
        if (!featsComponent) return;

        this.unfilledSlots = featsComponent.featSlots.filter(slot => !slot.feat);

        if (this.unfilledSlots.length > 0) {
            this.displayCurrentSlot();
        } else {
            this.finish();
        }
    }

    private displayCurrentSlot(): void {
        const currentSlot = this.unfilledSlots[this.currentSlotIndex];
        this.updateMessage(`Choose a feat for: ${currentSlot.source}`);
        this.populateAvailableFeats(currentSlot);
    }

    private async populateAvailableFeats(slot: FeatSlot): Promise<void> {
        this.availableFeatsContainer.innerHTML = '';
        const availableFeats = await this.getAvailableFeatsForSlot(slot, globalServiceLocator.contentLoader);

        for (const feat of availableFeats) {
            const featElement = document.createElement('button');
            featElement.classList.add('available-feat');
            if (feat.get) {
                const featData = await feat.get();
                if (featData) {
                    featElement.textContent = featData.name;
                }
            }
            featElement.addEventListener('click', () => this.selectFeat(feat, featElement));
            this.availableFeatsContainer.appendChild(featElement);
        }
    }

    private async selectFeat(feat: ContentItem, element: HTMLElement): Promise<void> {
        if (this.selectedFeatElement) {
            this.selectedFeatElement.classList.remove('selected');
        }

        this.selectedFeat = feat;
        this.selectedFeatElement = element;
        this.selectedFeatElement.classList.add('selected');

        if (feat.get) {
            const featData = await feat.get();
            this.updateSelectionInfo(featData);
        }
    }

    private async confirmFeatSelection(): Promise<void> {
        if (!this.selectedFeat || !this.selectedFeat.get) {
            this.updateMessage("Please select a feat before confirming.", true);
            return;
        }

        const currentSlot = this.unfilledSlots[this.currentSlotIndex];
        const featData = await this.selectedFeat.get();
        if (!featData) {
            this.updateMessage("Could not retrieve feat data.", true);
            return;
        }
        currentSlot.feat = featData.id;

        const playerId = globalServiceLocator.state.playerId;
        if (!playerId) return;
        const featsComponent = globalServiceLocator.world.getComponent(playerId, FeatsComponent);
        if (featsComponent) {
            featsComponent.feats.push(featData.id);
        }

        this.currentSlotIndex++;
        if (this.currentSlotIndex >= this.unfilledSlots.length) {
            this.finish();
        } else {
            this.selectedFeat = null;
            if (this.selectedFeatElement) {
                this.selectedFeatElement.classList.remove('selected');
            }
            this.selectedFeatElement = null;
            this.updateSelectionInfo(null);
            this.displayCurrentSlot();
        }
    }

    private finish(): void {
        this.updateMessage("All feats selected!");
        globalServiceLocator.eventBus.publish('ui:creation:next_step');
    }

    // --- Helper & UI Update Methods ---
    private updateMessage(message: string, isError: boolean = false): void {
        this.featSelectionMessage.textContent = message;
        this.featSelectionMessage.style.display = message ? 'block' : 'none';
        this.featSelectionMessage.classList.toggle('error', isError);
    }

    private updateSelectionInfo(data: any | null): void {
        if (data && data.name && data.description) {
            this.selectedName.textContent = data.name;
            this.selectedDesc.innerHTML = data.description;
            this.selectorInfo.style.display = 'block';
        } else {
            this.selectedName.textContent = '';
            this.selectedDesc.innerHTML = '';
            this.selectorInfo.style.display = 'none';
        }
    }

    private async getAvailableFeatsForSlot(slot: FeatSlot, contentLoader: ContentLoader): Promise<ContentItem[]> {
        const playerId = globalServiceLocator.state.playerId;
        if (!playerId) return [];

        const featsComponent = globalServiceLocator.world.getComponent(playerId, FeatsComponent);
        if (!featsComponent) return [];

        const allFeats = Object.values(contentLoader.contentData.feats) as ContentItem[];
        const filteredFeats: ContentItem[] = [];

        for (const feat of allFeats) {
            if (feat && feat.get) {
                const featData = await feat.get();
                if (featData) {
                    const alreadyTaken = featsComponent.feats.includes(featData.id);
                    const matchesTag = !slot.tags.length || slot.tags.some(tag => featData.tags.includes(tag));
                    const meetsPrerequisites = !featData.prerequisites.length || await this.checkPrerequisites(playerId, featData.prerequisites);

                    if (!alreadyTaken && matchesTag && meetsPrerequisites) {
                        filteredFeats.push(feat);
                    }
                }
            }
        }
        return filteredFeats;
    }

    private async checkPrerequisites(entityId: any, prerequisites: any): Promise<boolean> {
        if (!prerequisites) {
            return true;
        }

        const world = globalServiceLocator.world;
        const featsComponent = world.getComponent(entityId, FeatsComponent);

        for (const type in prerequisites) {
            const value = prerequisites[type];
            switch (type) {
                case 'attributes':
                    for (const attr in value) {
                        const requiredValue = value[attr];
                        const actualValue = await globalServiceLocator.modifierManager.queryStat(entityId, attr);
                        if (actualValue < requiredValue) {
                            return false;
                        }
                    }
                    break;
                case 'bab':
                    const requiredBab = value;
                    const actualBab = await globalServiceLocator.modifierManager.queryStat(entityId, 'bab');
                    if (actualBab < requiredBab) {
                        return false;
                    }
                    break;
                case 'feats':
                    if (!featsComponent) return false;
                    for (const featId of value) {
                        if (!featsComponent.feats.includes(featId)) {
                            return false;
                        }
                    }
                    break;
                default:
                    break;
            }
        }
        return true;
    }
}
