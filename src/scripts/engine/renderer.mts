// src/scripts/engine/renderer.mts
import { ContentItem } from "../engine/entities/contentItem.mjs";
import { UIHolder } from "../engine/entities/uiHolder.mjs";
import { GAME_STATE } from "../index.mjs";
import { setActiveScreen, showCharacterCreationStep, updateCampaignInfo, updateCampaignList } from "../ui/uiManager.mjs";
import { ContentLoader } from "./contentLoader.mjs";
import { Entity } from "./entities/entity.mjs";
import { MapTile } from "./entities/mapTile.mjs";
import { Monster } from "./entities/monster.mjs";

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

        const canvas: HTMLCanvasElement = getCanvas(gameArea);
        canvas.setAttribute("width", gameArea.clientWidth.toString());
        canvas.setAttribute("height", gameArea.clientHeight.toString());

        console.log("Game area is rendered:", gameArea);
    }

    public async renderScreen(allCampaignData: ContentItem, contentData: ContentItem) {
        if (!this.winDoc) {
            console.error('this.winDoc not initialized');
            return false;
        }
        setActiveScreen(GAME_STATE.currentScreen, this.uiScreens);
        console.log("Current Game State:", GAME_STATE.currentScreen);
        if (GAME_STATE.currentScreen === 'campaignSelection') {
            const fnUpdateCampaign = (campaignName: string) => {
                GAME_STATE.currentCampaignData = allCampaignData[campaignName];
                this.uiScreens.btns['campaignSelectBtn'].removeAttribute('style');
                console.log('Campaign selected', campaignName, GAME_STATE.currentCampaignData);
            }

            updateCampaignInfo(null, allCampaignData, this.uiScreens)
            updateCampaignList(allCampaignData, this.uiScreens.els['campaign-list-ul'], this.winDoc, this.uiScreens, fnUpdateCampaign);
        }
        if (GAME_STATE.currentScreen === 'characterCreation') {
            showCharacterCreationStep(GAME_STATE.creationStep, contentData, allCampaignData, this.uiScreens, this)
        }
        if (GAME_STATE.currentScreen === 'gameContainer') {
            const mapData: ContentItem = await GAME_STATE.currentCampaignData?.maps["starting_area"].get();
            if (!mapData) {
                console.error("Map not loaded.");
            }
            console.log("Loaded Map Data:", mapData);
            GAME_STATE.currentMapData = mapData; // Store map data in GAME_STATE
            this.renderMapFull(mapData);
        }
        return true;
    }

    public renderMapFull(mapData: ContentItem) {
        try {
            console.log('Rendering', mapData);
            this.draw();
            this.renderMap(mapData);
            this.renderPlayer();
            this.renderMonsters();
        } catch (error) {
            console.error("Error in renderScreen loading map:", error);
        }
    }

    private renderTile(
        context: CanvasRenderingContext2D,
        tileSymbol: string,
        tileX: number,
        tileY: number,
        tileSize: number,
        tileDefinitions: MapTile[]
    ) {
        const tileDef = tileDefinitions.find(def => def.symbol === tileSymbol) || tileDefinitions[5] as MapTile;
        const tileColor = tileDef.tileColor; // Use color from tileDef if found
        const tileChar = tileDef.tileChar;   // Use char from tileDef if found

        context.fillStyle = tileColor;
        context.fillRect(tileX, tileY, tileSize, tileSize);

        context.fillStyle = "white";
        context.font = '24px monospace';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(tileChar, tileX + tileSize / 2, tileY + tileSize / 2);
    }

    private renderEntity(
        context: CanvasRenderingContext2D,
        entity: Entity,
        char: string,
        color: string
    ) {
        const tileSize = 32;
        const startX = 10;
        const startY = 50;

        const entityX = entity.position.x; // Get entity x from entity.position
        const entityY = entity.position.y; // Get entity y from entity.position

        const entityCanvasX = startX + entityX * tileSize;
        const entityCanvasY = startY + entityY * tileSize;


        context.fillStyle = color; // Use color parameter
        context.font = '24px monospace';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(char, entityCanvasX + tileSize / 2, entityCanvasY + tileSize / 2); // Use char parameter
    }

    private renderMap(mapData: any) {
        if (!mapData || !mapData.tiles) {
            console.error("Invalid map data or tiles not found.");
            return;
        }

        const gameArea: HTMLElement = this.uiScreens.els['gameContainer'];
        const canvas: HTMLCanvasElement = getCanvas(gameArea);
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
                this.renderTile(context, tileSymbol, tileX, tileY, tileSize, tileDefinitions);
            });
        });
    }

    public redrawTiles(prevPosition: { x: number, y: number }, newPosition: { x: number, y: number }) {
        const mapData = GAME_STATE.currentMapData; // Get map data from GAME_STATE
        const tileDefinitions = this.contentLoader.tileDefinitions; // Get tile definitions
        if (!mapData || !mapData.tiles || !tileDefinitions) {
            console.error("Cannot redraw tiles: mapData or tileDefinitions missing.");
            return;
        }

        const gameArea: HTMLElement = this.uiScreens.els['gameContainer'];
        const canvas: HTMLCanvasElement = getCanvas(gameArea);
        const context = canvas.getContext('2d');
        if (!context) {
            console.error('Canvas 2d Context is null');
            return;
        }

        const tileSize = 32;
        const startX = 10;
        const startY = 50;

        const redrawTileAtPosition = (position: { x: number, y: number }) => { // Helper function to redraw a single tile
            const tileX = startX + position.x * tileSize;
            const tileY = startY + position.y * tileSize;
            const tileSymbol = mapData.tiles[position.y][position.x];
            this.renderTile(context, tileSymbol, tileX, tileY, tileSize, tileDefinitions);
        };

        redrawTileAtPosition(prevPosition);
        redrawTileAtPosition(newPosition);
    }

    public renderPlayer() {
        const player = GAME_STATE.player;
        if (!player) {
            console.log("Player is not initialized");
            return;
        }

        const gameArea: HTMLElement = this.uiScreens.els['gameContainer'];
        const canvas: HTMLCanvasElement = getCanvas(gameArea);
        const context = canvas.getContext('2d');
        if (!context) {
            console.error('Canvas 2d Context is null');
            return;
        }

        // --- Render Player Character
        this.renderEntity(context, player, '@', 'yellow');;
    }

    public renderMonsters() {
        const gameArea: HTMLElement = this.uiScreens.els['gameContainer'];
        const canvas: HTMLCanvasElement = getCanvas(gameArea);
        const context = canvas.getContext('2d');
        if (!context) {
            console.error('Canvas 2d Context is null');
            return;
        }

        // --- Render Monsters ---
        GAME_STATE.monsters.forEach((monster: Monster) => { // Iterate through monsters array
            this.renderEntity(context, monster, monster.ascii_char, monster.color); // Render each monster
        });
    }
}

function getCanvas(gameArea: HTMLElement): HTMLCanvasElement {
    return gameArea.getElementsByTagName('canvas')[0] as HTMLCanvasElement;
}
