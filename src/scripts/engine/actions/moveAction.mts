import { Entity } from '../entities/entity.mjs';
import { MapTile } from '../entities/mapTile.mjs';
import { globalServiceLocator } from '../serviceLocator.mjs';
import { EntityPosition } from '../utils.mjs';
import { Action, ActionType } from './action.mjs';

export class MoveAction extends Action {
    public readonly cost: ActionType = ActionType.Move;
    private direction: EntityPosition;

    constructor(actor: Entity, direction: EntityPosition) {
        super(actor);
        this.direction = direction;
    }

    public execute() {
        console.log(`${this.actor.name} executes MoveAction.`);

        const player = globalServiceLocator.state.player;
        if (!player) {
            console.log("Player is not initialized");
            return;
        }

        const currentPlayerPosition = player.position;
        const intendedNewPosition = {
            x: currentPlayerPosition.x + this.direction.x,
            y: currentPlayerPosition.y + this.direction.y,
        };

        const mapTiles = globalServiceLocator.state.currentMapData.tiles; // Get map tiles
        const mapHeight = mapTiles.length;
        const mapWidth = mapTiles[0].length;
        const tileDefinitions = globalServiceLocator.contentLoader.tileDefinitions; // Get tile definitions
        const isValidMovement: boolean = intendedNewPosition.x >= 0
            && intendedNewPosition.x < mapWidth
            && intendedNewPosition.y >= 0
            && intendedNewPosition.y < mapHeight;

        if (!tileDefinitions) {
            console.error('Tile definitions not loaded');
            return;
        }

        if (!isValidMovement) {
            // Do NOT update player position - boundary collision
            console.log("Movement blocked by map boundary");
            globalServiceLocator.renderer.renderPlayer(); // Still render player even on blocked move, for animation/feedback if needed
            return;
        }

        const tileSymbolAtNewPosition = mapTiles[intendedNewPosition.y][intendedNewPosition.x];
        const tileDef = tileDefinitions.find(def => def.symbol === tileSymbolAtNewPosition) || tileDefinitions[5];
        const isBlockingTile = tileDef.isBlocking;

        if (isBlockingTile) {
            // Do NOT update player position - wall collision
            console.log("Movement blocked by wall:", tileDef?.name || "Wall");
            globalServiceLocator.renderer.renderPlayer(); // Still render player even on blocked move
            return;
        }

        (() => {
            // Valid move - update player position
            const prevPlayerPosition = { ...player.position }; // Store previous position for redraw
            player.position = intendedNewPosition;

            if (tileDef && tileDef.isTrigger) {
                console.log("Stepped on a trigger tile!");

                const triggerSymbol = tileSymbolAtNewPosition;
                const trigger = globalServiceLocator.state.currentMapData.triggers.find(
                    (triggerDef: MapTile) => triggerDef.symbol === triggerSymbol
                );

                if (trigger) {
                    const targetMapName = trigger.targetMap;
                    const targetLocation = trigger.targetLocation;
                    console.log('Hit trigger', targetMapName, targetLocation);

                    const newMapData = globalServiceLocator.state.currentCampaignData?.maps[targetMapName].get();
                    if (!newMapData) {
                        console.error("Failed to load target map:", targetMapName);
                    }

                    player.position = targetLocation;
                    globalServiceLocator.state.currentMapData = newMapData;
                    globalServiceLocator.renderer.renderMapFull(newMapData);
                    return; // Exit after map transition
                } else {
                    console.error("Trigger definition not found for symbol:", triggerSymbol);
                }
            }

            globalServiceLocator.renderer.redrawTiles(prevPlayerPosition, intendedNewPosition); // Partial redraw for normal movement
            globalServiceLocator.renderer.renderPlayer();
        })();
    }
}