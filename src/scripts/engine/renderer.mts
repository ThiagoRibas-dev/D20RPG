// src/scripts/engine/renderer.mts
import { ContentItem } from "../engine/entities/contentItem.mjs";
import { UIHolder } from "../engine/entities/uiHolder.mjs";
import { GAME_STATE } from "../index.mjs";
import { setActiveScreen, showCharacterCreationStep, updateCampaignInfo, updateCampaignList } from "../ui/uiManager.mjs";
import { ContentLoader } from "./contentLoader.mjs";
import { MapTile } from "./entities/mapTile.mjs";

export class Renderer {
    private uiScreens: UIHolder;
    private winDoc: any;
    private contentLoader: ContentLoader;

    constructor(uiScreens: UIHolder, winDoc: any, contentLoader: ContentLoader) {
        this.uiScreens = uiScreens;
        this.winDoc = winDoc;
        this.contentLoader = contentLoader;
    }

    public draw() { // this may be expanded to receive the content of json and its associated hardcoded code for handling these files
        if (!this.uiScreens) {
            console.error("Game Elements not defined on render function, stopping");
            return;
        }
        const gameArea: HTMLElement = this.uiScreens.els['gameContainer']
        if (!gameArea) {
            console.error("Game area element not defined");
            return;
        }

        const canvas: HTMLCanvasElement = gameArea.firstElementChild as HTMLCanvasElement;
        canvas.setAttribute("width", gameArea.clientWidth.toString());
        canvas.setAttribute("height", gameArea.clientHeight.toString());

        console.log("Game area is rendered:", gameArea);
    }

    public async renderScreen(campaignData: ContentItem, contentData: ContentItem) {
        if (!this.winDoc) {
            console.error('this.winDoc not initialized');
            return false;
        }
        setActiveScreen(GAME_STATE.currentScreen, this.uiScreens);
        console.log("Current Game State:", GAME_STATE.currentScreen);
        if (GAME_STATE.currentScreen === 'campaignSelection') {
            updateCampaignInfo(null, campaignData, this.uiScreens)
            updateCampaignList(campaignData, this.uiScreens.els['campaign-list-ul'], this.winDoc, this.uiScreens, (campaignName: string) => {
                GAME_STATE.campaign = campaignName;
                this.uiScreens.btns['campaignSelectBtn'].removeAttribute('style');
                console.log('Campaign selected', GAME_STATE.campaign)
            });
        }
        if (GAME_STATE.currentScreen === 'characterCreation') {
            showCharacterCreationStep(GAME_STATE.creationStep, contentData, campaignData, this.uiScreens, this)
        }
        if (GAME_STATE.currentScreen === 'gameContainer') {
            this.draw();
            console.log("Loaded data from a valid file system path as planned for this new game step using placeholder assets. The new render step will now make it show properly by accessing dynamic or user generated json files under all previously defined data, engine implementation and file systems or calls and methods/functions")

            const mapData: ContentItem = await this.contentLoader.loadMap(GAME_STATE.campaign, "starting_area");
            if (mapData) { // Check if mapData is not null before using it
                console.log("Loaded Map Data:", mapData);
                GAME_STATE.currentMapData = mapData; // Store map data in GAME_STATE <--- ADD THIS

                // ... proceed with rendering map ... 
                this.renderMap(mapData); // Call renderMap to draw the map!
            } else {
                console.error("Failed to load map data."); // Handle null mapData
            }
        }
        return true;
    }

    private renderMap(mapData: any) {
        if (!mapData || !mapData.tiles) {
            console.error("Invalid map data or tiles not found.");
            return;
        }

        const gameArea: HTMLElement = this.uiScreens.els['gameContainer'];
        const canvas: HTMLCanvasElement = gameArea.firstElementChild as HTMLCanvasElement;
        const context = canvas.getContext('2d');
        if (!context) {
            console.error('Canvas 2d Context is null');
            return;
        }
        context.clearRect(0, 0, canvas.width, canvas.height);

        const tileSize = 32;
        const startX = 10;
        const startY = 50;
        const tileDefinitions = this.contentLoader.tileDefinitions;

        if (!tileDefinitions) {
            console.error("Tile definitions not loaded!");
            return;
        }

        mapData.tiles.forEach((row: string, rowIndex: number) => {
            row.split('').forEach((tileSymbol: string, colIndex: number) => {
                const tileX = startX + colIndex * tileSize;
                const tileY = startY + rowIndex * tileSize;
                const tileDef = this.getTileDef(tileDefinitions, tileSymbol);
                const tileColor = tileDef.tileColor;
                const tileChar = tileDef.tileChar;

                context.fillStyle = tileColor;
                context.fillRect(tileX, tileY, tileSize, tileSize);

                context.fillStyle = "white";
                context.font = '24px monospace';
                context.textAlign = 'center';
                context.textBaseline = 'middle';
                context.fillText(tileChar, tileX + tileSize / 2, tileY + tileSize / 2);
            });
        });

        // --- Render Player Character --- (No changes needed here)
        const playerX = GAME_STATE.player.position.x;
        const playerY = GAME_STATE.player.position.y;

        const playerCanvasX = startX + playerX * tileSize;
        const playerCanvasY = startY + playerY * tileSize;

        const playerChar = '@';
        context.fillStyle = "yellow";
        context.font = '24px monospace';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(playerChar, playerCanvasX + tileSize / 2, playerCanvasY + tileSize / 2);
    }
    private getTileDef(tileDefinitions: MapTile[], tileSymbol: string): MapTile { // Added type annotation for tileDefinitions and return type <---
        return tileDefinitions.find(def => def.symbol === tileSymbol) || {
            symbol: '?',         // Default symbol is '?' for unknown <---
            name: 'Unknown',      // Added default name, isBlocking, isTrigger, tileColor too for completeness of TileDefinition
            isBlocking: true,
            isTrigger: false,
            tileColor: 'black',
            tileChar: '?'          // Default tileChar is '?' for unknown <--- (was 'F', changed to '?')
        } as MapTile; //Explicit cast to TileDefinition for type safety of the default return.
    }
}