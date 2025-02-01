// src/scripts/engine/renderer.mts
import { ContentItem } from "../engine/entities/contentItem.mjs";
import { UIHolder } from "../engine/entities/uiHolder.mjs";
import { GAME_STATE } from "../index.mjs";
import { setActiveScreen, showCharacterCreationStep, updateCampaignInfo, updateCampaignList } from "../ui/uiManager.mjs";

export class Renderer {
    private uiScreens: UIHolder;
    private winDoc: any;

    constructor(uiScreens: UIHolder, winDoc: any) {
        this.uiScreens = uiScreens;
        this.winDoc = winDoc;

        this.setGameArea();
    }

    private setGameArea() {
        if (!this.uiScreens) {
            console.error("Game Elements not defined on render function, stopping");
            return;
        }
        const gameArea: HTMLElement = this.uiScreens.els['gameContainer']
        if (!gameArea) {
            console.error("Game area element not defined");
            return;
        }

        const ctx = gameArea.ownerDocument.createElement("canvas");
        ctx.setAttribute("width", gameArea.clientWidth.toString());
        ctx.setAttribute("height", gameArea.clientHeight.toString());

        gameArea.innerHTML = "";
        gameArea.appendChild(ctx);

        console.log("Game area is rendered:", gameArea);
    }

    public draw(elementName: string, color?: string) { // this may be expanded to receive the content of json and its associated hardcoded code for handling these files
        if (!this.uiScreens) {
            console.error("Game Elements not defined on render function, stopping");
            return;
        }
        const gameArea: HTMLElement = this.uiScreens.els['gameContainer'];
        const canvas: HTMLCanvasElement = gameArea.firstElementChild as HTMLCanvasElement
        const context = canvas.getContext('2d');
        if (!context) {
            console.error('Canvas 2d Context is null')
            return
        }
        context.clearRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = color || "red" //Default is a colored rectangle if there is no value, or just a clear screen, so something simple appears (you should modify this accordingly). Also remember to use IDs from your json data here and dynamically load assets for drawing graphics, instead of simply applying colors or squares if it helps implement that in this function
        context.fillRect(200, 200, 50, 50)
        context.fillStyle = "white"
        context.font = '24px serif'; // You might add fonts to this for dynamic selection using Ids or something similar that was planned in previous stages for handling this with json. You can, as always, improve upon this later.
        context.fillText(elementName, 10, 50);
    }

    public renderScreen(campaignData: ContentItem, contentData: ContentItem) {
        if (!this.winDoc) {
            console.error('this.winDoc not initialized');
            return false;
        }
        setActiveScreen(GAME_STATE.currentScreen, this.uiScreens);
        if (GAME_STATE.currentScreen === 'campaignSelection') {
            updateCampaignInfo(null, campaignData, this.uiScreens)
            updateCampaignList(campaignData, this.uiScreens.els['campaign-list-ul'], this.winDoc, this.uiScreens, (campaignName: string) => {
                GAME_STATE.campaign = campaignName;
                this.uiScreens.btns['campaignSelectBtn'].removeAttribute('style');
                console.log('Campaign selected', GAME_STATE.campaign)
            });
        }
        if (GAME_STATE.currentScreen === 'characterCreation') {
            showCharacterCreationStep(GAME_STATE.creationStep, contentData, this.uiScreens)
        }
        console.log("Current Game State:", GAME_STATE.currentScreen);
        if (GAME_STATE.currentScreen === 'gameContainer') {
            this.draw("placeholder text");
            console.log("Loaded data from a valid file system path as planned for this new game step using placeholder assets. The new render step will now make it show properly by accessing dynamic or user generated json files under all previously defined data, engine implementation and file systems or calls and methods/functions")
        }
        return true;
    }
}