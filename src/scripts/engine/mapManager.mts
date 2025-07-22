import { globalServiceLocator } from "./serviceLocator.mjs";
import { PositionComponent, TerrainComponent } from "./ecs/components/index.mjs";

export class MapManager {

    public async loadMap(mapId: string, targetLocation?: { x: number, y: number }) {
        const state = globalServiceLocator.state;
        const world = globalServiceLocator.world;

        if (!state.currentCampaignData) {
            console.error("No campaign selected.");
            return;
        }

        const mapData = await state.currentCampaignData.maps[mapId].get();
        state.currentMapData = mapData;

        if (!mapData || !mapData.tiles) {
            console.error("Invalid map data or tiles not found.");
            return;
        }

        // Clear existing terrain
        const terrainEntities = world.getEntitiesWith(TerrainComponent);
        for (const entity of terrainEntities) {
            world.destroyEntity(entity);
        }

        // Create new terrain
        mapData.tiles.forEach((row: string, y: number) => {
            row.split('').forEach((char: string, x: number) => {
                const tileEntity = world.createEntity();
                world.addComponent(tileEntity, new PositionComponent(x, y));
                world.addComponent(tileEntity, new TerrainComponent(char));
            });
        });

        // Position the player
        if (state.playerId !== null) {
            const playerPosition = world.getComponent(state.playerId, PositionComponent);
            if (playerPosition) {
                if (targetLocation) {
                    // Use target location if provided (for triggers)
                    playerPosition.x = targetLocation.x;
                    playerPosition.y = targetLocation.y;
                } else if (mapData.playerStart) {
                    // Otherwise, use the map's default start (for initial load)
                    playerPosition.x = mapData.playerStart.x;
                    playerPosition.y = mapData.playerStart.y;
                }
            }
        }
    }
}
