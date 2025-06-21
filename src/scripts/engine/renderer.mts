import { ContentItem } from "../engine/entities/contentItem.mjs";
import { Entity } from "./entities/entity.mjs";
import { MapTile } from "./entities/mapTile.mjs";
import { Npc } from "./entities/npc.mjs";
import { globalServiceLocator } from "./serviceLocator.mjs";

export class Renderer {
    private winDoc: any;

    constructor(winDoc: any) {
        this.winDoc = winDoc;
    }

    public draw() {
        const uiScreens = globalServiceLocator.ui;
        if (!uiScreens) {
            console.error("Game Elements not defined on render function, stopping");
            return;
        }
        const gameArea: HTMLElement = uiScreens.els['gameContainer']
        if (!gameArea) {
            console.error("Game area element not defined");
            return;
        }

        const canvas: HTMLCanvasElement = getCanvas(gameArea);
        canvas.setAttribute("width", gameArea.clientWidth.toString());
        canvas.setAttribute("height", gameArea.clientHeight.toString());

        console.log("Game area is rendered:", gameArea);
    }

    /**
      * Replaces renderScreen. This is a high-level function that renders the
      * entire visible game world on the canvas. It is called by an external
      * controller (like the uiManager) when the game screen is active.
      */
    public renderMapFull(mapData: ContentItem) {
        try {
            console.log('Renderer: Drawing full map and entities.');
            this.draw();
            this.renderMap(mapData);
            this.renderPlayer();
            this.renderNpcs();
        } catch (error) {
            console.error("Error in renderMapFull:", error);
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

    private renderEntity(context: CanvasRenderingContext2D, entity: Entity) {
        if (!entity.renderable) {
            return;
        }

        // Get data from the component
        const { char, color } = entity.renderable;

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

        const uiScreens = globalServiceLocator.ui;
        const contentLoader = globalServiceLocator.contentLoader;
        const gameArea: HTMLElement = uiScreens.els['gameContainer'];
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
        const tileDefinitions = contentLoader.tileDefinitions;

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
        const uiScreens = globalServiceLocator.ui;
        const contentLoader = globalServiceLocator.contentLoader;
        const gameState = globalServiceLocator.state;


        const mapData = gameState.currentMapData; // Get map data from gameState
        const tileDefinitions = contentLoader.tileDefinitions; // Get tile definitions
        if (!mapData || !mapData.tiles || !tileDefinitions) {
            console.error("Cannot redraw tiles: mapData or tileDefinitions missing.");
            return;
        }

        const gameArea: HTMLElement = uiScreens.els['gameContainer'];
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

    /**
      * Renders the player character by calling the generic renderEntity method.
      */
    public renderPlayer() {
        const gameState = globalServiceLocator.state;
        const player = gameState.player;
        if (!player) {
            console.log("Player is not initialized");
            return;
        }

        const uiScreens = globalServiceLocator.ui;
        const gameArea: HTMLElement = uiScreens.els['gameContainer'];
        const canvas: HTMLCanvasElement = getCanvas(gameArea);
        const context = canvas.getContext('2d');
        if (!context) return;

        // The new, simplified call. No more hardcoded '@' or 'yellow'.
        this.renderEntity(context, player);
    }

    /**
     * Renders all monsters by looping and calling the generic renderEntity method.
     */
    public renderNpcs() {
        const gameState = globalServiceLocator.state;
        const uiScreens = globalServiceLocator.ui;
        const gameArea: HTMLElement = uiScreens.els['gameContainer'];
        const canvas: HTMLCanvasElement = getCanvas(gameArea);
        const context = canvas.getContext('2d');
        if (!context) return;

        gameState.npcs.forEach((monster: Npc) => {
            this.renderEntity(context, monster);
        });
    }
}

function getCanvas(gameArea: HTMLElement): HTMLCanvasElement {
    return gameArea.getElementsByTagName('canvas')[0] as HTMLCanvasElement;
}
