import { ContentItem } from '../../engine/entities/contentItem.mjs';
import { ServiceLocator } from '../../engine/serviceLocator.mjs';

export class CampaignSelectionView {
    private container: HTMLElement;
    private listContainer: HTMLUListElement;
    private infoContainer: HTMLElement;
    private nameText: HTMLParagraphElement;
    private descText: HTMLParagraphElement;
    private selectButton: HTMLButtonElement;

    constructor() {
        const ui = ServiceLocator.UI;
        this.container = ui.els['campaignSelection'];
        this.listContainer = ui.els['campaign-list-ul'];
        this.infoContainer = ui.els['campaign-info'];
        this.nameText = ui.els['campaign-name'];
        this.descText = ui.els['campaign-desc'];
        this.selectButton = ui.btns['campaignSelectBtn'];
    }

    public async render(allCampaignData: ContentItem): Promise<void> {
        this.listContainer.innerHTML = ''; // Clear old list
        this.listContainer.style.display = '';
        this.infoContainer.style.display = 'none'; // Hide info panel initially
        this.selectButton.style.display = 'none'; // Hide select button initially

        for (const campaignId in allCampaignData) {
            // Standard check to ignore prototype properties
            if (campaignId !== 'type' && campaignId !== 'get') {
                const campaignItem = allCampaignData[campaignId];
                const campaignInfo = await campaignItem.about.info.get();

                const campaignLi = this.container.ownerDocument.createElement('li');
                campaignLi.classList.add('campaign-item');
                campaignLi.textContent = campaignInfo?.name || campaignId;

                campaignLi.onclick = () => this.selectCampaign(campaignId, campaignInfo, allCampaignData);

                console.log('campaignLi', campaignLi);
                this.listContainer.appendChild(campaignLi);
            }
        }
    }

    private selectCampaign(campaignId: string, campaignInfo: any, allCampaignData: ContentItem): void {
        ServiceLocator.State.currentCampaignData = allCampaignData[campaignId];

        this.nameText.innerText = campaignInfo?.name || "";
        this.descText.innerText = campaignInfo?.description || "";

        this.infoContainer.style.display = "";
        this.nameText.style.display = "";
        this.descText.style.display = "";
        this.selectButton.removeAttribute('style');

        console.log('Campaign selected:', campaignId, ServiceLocator.State.currentCampaignData);
    }

    public show(): void { this.container.style.display = ''; }
    public hide(): void { this.container.style.display = 'none'; }
}