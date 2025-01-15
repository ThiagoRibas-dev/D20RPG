// src/scripts/engine/this.mts
import { GAME_STATE } from "../index.mjs";
import { displayClasses, displayRaces, displaySkills, setActiveScreen, updateCampaignInfo } from "../ui/uiManager.mjs";
import { updateAbilityScoreDisplay } from "./dataManager.mjs";
import { ContentItem } from "./entities/contentItem.mjs";
import { UIHolder } from "./entities/uiholder.mjs";

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

        const ctx = gameArea.ownerDocument.createElement("canvas")
        ctx.setAttribute("width", gameArea.clientWidth.toString())
        ctx.setAttribute("height", gameArea.clientHeight.toString())

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
            this.doCampaignSelection(campaignData);
        }
        if (GAME_STATE.currentScreen === 'characterCreation') {
            this.doCharacterCreation(contentData);
        }
        console.log("Current Game State:", GAME_STATE.currentScreen);
        if (GAME_STATE.currentScreen === 'gameContainer') {
            this.draw("placeholder text");
            console.log("Loaded data from a valid file system path as planned for this new game step using placeholder assets. The new render step will now make it show properly by accessing dynamic or user generated json files under all previously defined data, engine implementation and file systems or calls and methods/functions")
        }
        return true;
    }
    public async doCampaignSelection(campaignData: ContentItem) {
        const campaignListContainer = this.uiScreens.els['campaign-list-ul'];
        campaignListContainer.innerHTML = '';

        const campaignSelectBtn = this.uiScreens.btns['campaignSelectBtn'];
        campaignSelectBtn.style.display = "none"

        for (var name in campaignData) {
            if (name !== 'type' && name !== 'get') {
                const campaignItem = campaignData[name];
                const campaign = await campaignItem.about.info.get();
                const campaignLi = this.winDoc.createElement('li');
                campaignLi.classList.add('campaign-item');
                campaignLi.textContent = campaign?.name || name;
                campaignLi.onclick = async () => {
                    updateCampaignInfo(name, campaignData, this.uiScreens);
                    this.uiScreens.btns['campaignSelectBtn'].removeAttribute('style');
                };
                campaignListContainer.appendChild(campaignLi);
            }
        }
    }

    public doCharacterCreation(contentData: ContentItem) {
        const raceListContainer = this.uiScreens.els['races-selector'];
        const abilityScoresContainer = this.uiScreens.els['ability-score-selection'];
        const classListContainer = this.uiScreens.els['classes-selector'];
        const skillListContainer = this.uiScreens.els['skills-selector'];
        const btnBack = this.uiScreens.btns['back-btn'];
        const btnNext = this.uiScreens.btns['next-btn'];
        const elStepDesc = this.uiScreens.els['step-description'];
        const elSelectionInfo = this.uiScreens.els['selector-info'];

        elSelectionInfo.style.display = "none";
        raceListContainer.style.display = "none";
        classListContainer.style.display = "none";
        skillListContainer.style.display = "none";
        abilityScoresContainer.style.display = "none"

        btnBack.style.display = "none";
        btnNext.style.display = "none";
        if (GAME_STATE.creationStep === 0) {
            raceListContainer.style.display = '';

            btnNext.style.display = "";
            elStepDesc.innerText = "Choose a Race";
            displayRaces(contentData, raceListContainer, this.uiScreens);
            return
        }
        if (GAME_STATE.creationStep === 1) {
            abilityScoresContainer.style.display = "";

            btnBack.style.display = "";
            elStepDesc.innerText = "Set Abilities";
            updateAbilityScoreDisplay(this.uiScreens);
            return;
        }
        if (GAME_STATE.creationStep === 2) {
            classListContainer.style.display = "";

            btnBack.style.display = "";
            btnNext.style.display = "";
            elStepDesc.innerText = "Choose a Class";
            displayClasses(contentData, classListContainer, this.uiScreens);
            return;
        }
        if (GAME_STATE.creationStep === 3) {
            skillListContainer.style.display = "";

            btnBack.style.display = "";
            elStepDesc.innerText = "Skills";
            displaySkills(skillListContainer, this.uiScreens);
            return;
        }
        if (GAME_STATE.creationStep === 4) {
            elStepDesc.innerText = "Confirm Character Data";
            //Here we display an actual character, from game state data.
            console.log("Character creation is finished. You may go back to the start menu to load your progress", GAME_STATE.player);
            return;
        }
    }

}