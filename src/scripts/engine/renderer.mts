import { ContentItem } from "../engine/entities/contentItem.mjs";
import { MapTile } from "./entities/mapTile.mjs";
import { GameEvents } from "./events.mjs";
import { globalServiceLocator } from "./serviceLocator.mjs";
import { EntityID } from "./ecs/world.mjs";
import { PositionComponent, RenderableComponent } from "./ecs/components/index.mjs";

export class Renderer {
    public tileSize = 32;
    public canvas: HTMLCanvasElement;
    private startX = 10;
    private startY = 50;

    constructor() {
        this.canvas = this.getCanvas();
        this.initEventListeners();
    }

    private initEventListeners(): void {
        const canvas = this.getCanvas();
        if (!canvas) return;

        canvas.addEventListener('click', (event) => {
            const rect = canvas.getBoundingClientRect();
            const canvasX = event.clientX - rect.left;
            const canvasY = event.clientY - rect.top;

            const tileCoords = this.canvasToTileCoords(canvasX, canvasY);
            const targetEntity = this.findEntityAt(tileCoords);

            globalServiceLocator.eventBus.publish(GameEvents.UI_MAP_CLICKED, {
                entity: targetEntity,
                tileCoords: tileCoords
            });
        });

        canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            globalServiceLocator.eventBus.publish(GameEvents.UI_INPUT_CANCELED);
        });
    }

    public clear(): void {
        const context = this.getCanvas().getContext('2d');
        if (context) {
            context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    public drawCharacter(x: number, y: number, char: string, color: string): void {
        const context = this.getCanvas().getContext('2d');
        if (!context) return;

        const canvasX = this.startX + x * this.tileSize;
        const canvasY = this.startY + y * this.tileSize;

        context.fillStyle = color;
        context.font = '24px monospace';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(char, canvasX + this.tileSize / 2, canvasY + this.tileSize / 2);
    }

    public draw() {
        const uiScreens = globalServiceLocator.ui;
        if (!uiScreens) {
            console.error("Game Elements not defined on render function, stopping");
            return;
        }
        const gameArea: HTMLElement = uiScreens.els['gameContainer'];
        if (!gameArea) {
            console.error("Game area element not defined");
            return;
        }

        const canvas: HTMLCanvasElement = this.getCanvas();
        canvas.setAttribute("width", gameArea.clientWidth.toString());
        canvas.setAttribute("height", gameArea.clientHeight.toString());
    }

    public renderMapFull(mapData: ContentItem) {
        try {
            const gameState = globalServiceLocator.state;
            if (gameState.playerId === null) {
                throw Error("Player is not defined");
            }

            this.draw();
            this.renderMap(mapData);
            this.renderSingleEntity(gameState.playerId);
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
        const tileColor = tileDef.tileColor;
        const tileChar = tileDef.tileChar;

        context.fillStyle = tileColor;
        context.fillRect(tileX, tileY, tileSize, tileSize);

        context.fillStyle = "white";
        context.font = '24px monospace';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(tileChar, tileX + tileSize / 2, tileY + tileSize / 2);
    }

    private renderEntity(context: CanvasRenderingContext2D, position: PositionComponent, renderable: RenderableComponent) {
        this.drawCharacter(position.x, position.y, renderable.char, renderable.color);
    }

    public renderMap(mapData: any) {
        if (!mapData || !mapData.tiles) {
            console.error("Invalid map data or tiles not found.");
            return;
        }

        const contentLoader = globalServiceLocator.contentLoader;
        const canvas: HTMLCanvasElement = this.getCanvas();
        const context = canvas.getContext('2d');
        if (!context) return;

        const tileDefinitions = contentLoader.tileDefinitions;
        if (!tileDefinitions) {
            console.error("Tile definitions not loaded!");
            return;
        }

        mapData.tiles.forEach((row: string, rowIndex: number) => {
            row.split('').forEach((tileSymbol: string, colIndex: number) => {
                const tileX = this.startX + colIndex * this.tileSize;
                const tileY = this.startY + rowIndex * this.tileSize;
                this.renderTile(context, tileSymbol, tileX, tileY, this.tileSize, tileDefinitions);
            });
        });
    }

    public redrawTiles(prevPosition: { x: number, y: number }, newPosition: { x: number, y: number }) {
        const contentLoader = globalServiceLocator.contentLoader;
        const gameState = globalServiceLocator.state;
        const mapData = gameState.currentMapData;
        const tileDefinitions = contentLoader.tileDefinitions;
        if (!mapData || !mapData.tiles || !tileDefinitions) return;

        const context = this.getCanvas().getContext('2d');
        if (!context) return;

        const redrawTileAtPosition = (position: { x: number, y: number }) => {
            const tileX = this.startX + position.x * this.tileSize;
            const tileY = this.startY + position.y * this.tileSize;
            const tileSymbol = mapData.tiles[position.y][position.x];
            this.renderTile(context, tileSymbol, tileX, tileY, this.tileSize, tileDefinitions);
        };

        redrawTileAtPosition(prevPosition);
        redrawTileAtPosition(newPosition);
    }

    public renderSingleEntity(entityId: EntityID) {
        const world = globalServiceLocator.world;
        const position = world.getComponent(entityId, PositionComponent);
        const renderable = world.getComponent(entityId, RenderableComponent);

        if (!position || !renderable) return;

        const context = this.getCanvas().getContext('2d');
        if (!context) return;

        this.renderEntity(context, position, renderable);
    }

    public renderNpcs() {
        const gameState = globalServiceLocator.state;
        const context = this.getCanvas().getContext('2d');
        if (!context) return;

        gameState.npcs.forEach((npcId: EntityID) => {
            this.renderSingleEntity(npcId);
        });
    }

    public canvasToTileCoords(canvasX: number, canvasY: number): { x: number, y: number } {
        const tileX = Math.floor((canvasX - this.startX) / this.tileSize);
        const tileY = Math.floor((canvasY - this.startY) / this.tileSize);
        return { x: tileX, y: tileY };
    }

    public findEntityAt(tileCoords: { x: number, y: number }): EntityID | null {
        const state = globalServiceLocator.state;
        const world = globalServiceLocator.world;

        if (state.playerId !== null) {
            const playerPos = world.getComponent(state.playerId, PositionComponent);
            if (playerPos && playerPos.x === tileCoords.x && playerPos.y === tileCoords.y) {
                return state.playerId;
            }
        }

        for (const npcId of state.npcs) {
            const npcPos = world.getComponent(npcId, PositionComponent);
            if (npcPos && npcPos.x === tileCoords.x && npcPos.y === tileCoords.y) {
                return npcId;
            }
        }

        return null;
    }

    public getCanvas(): HTMLCanvasElement {
        return globalServiceLocator.ui.els['gameContainer'].querySelector('canvas')!;
    }
}
