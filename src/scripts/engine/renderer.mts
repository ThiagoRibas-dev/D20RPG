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
        const tileDef = this.getTileDef(tileDefinitions, tileSymbol);

        let tileColor = "black"; // Default color for unknown tiles
        let tileChar = "?";     // Default char for unknown tiles

        if (tileDef) { // Check if tileDef is valid (not undefined)
            tileColor = tileDef.tileColor; // Use color from tileDef if found
            tileChar = tileDef.tileChar;   // Use char from tileDef if found
        } else {
            console.warn(`Tile definition not found for symbol: ${tileSymbol}. Using default.`); // Optional: Warn in console for missing definitions
        }

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
        entity: any, // For MVP, use 'any' for entity type, refine later if needed
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
                this.renderTile(context, tileSymbol, tileX, tileY, tileSize, tileDefinitions);
            });
        });

        // --- Render Player Character --- (No changes needed here)
        this.renderEntity(context, GAME_STATE.player, '@', 'yellow');
    }

    private getTileDef(tileDefinitions: MapTile[], tileSymbol: string): MapTile { // Added type annotation for tileDefinitions and return type

        return tileDefinitions.find(def => def.symbol === tileSymbol) || {
            symbol: '?',         // Default symbol is '?' for unknown
            name: 'Unknown',      // Added default name, isBlocking, isTrigger, tileColor too for completeness of TileDefinition
            isBlocking: true,
            isTrigger: false,
            tileColor: 'black',
            tileChar: '?'          // Default tileChar is '?' for unknown
        } as MapTile; //Explicit cast to TileDefinition for type safety of the default return.
    }

    public redrawTiles(prevPosition: { x: number, y: number }, newPosition: { x: number, y: number }) { // New redrawTiles function
        const mapData = GAME_STATE.currentMapData; // Get map data from GAME_STATE
        const tileDefinitions = this.contentLoader.tileDefinitions; // Get tile definitions
        if (!mapData || !mapData.tiles || !tileDefinitions) {
            console.error("Cannot redraw tiles: mapData or tileDefinitions missing.");
            return;
        }

        const gameArea: HTMLElement = this.uiScreens.els['gameContainer'];
        const canvas: HTMLCanvasElement = gameArea.firstElementChild as HTMLCanvasElement;
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
        const canvas: HTMLCanvasElement = gameArea.firstElementChild as HTMLCanvasElement;
        const context = canvas.getContext('2d');
        if (!context) {
            console.error('Canvas 2d Context is null');
            return;
        }
        const tileSize = 32;
        const startX = 10;
        const startY = 50;

        const playerX = player.position.x;
        const playerY = player.position.y;

        const playerCanvasX = startX + playerX * tileSize;
        const playerCanvasY = startY + playerY * tileSize;

        const playerChar = '@';
        context.fillStyle = "yellow";
        context.font = '24px monospace';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(playerChar, playerCanvasX + tileSize / 2, playerCanvasY + tileSize / 2);
    }
}