import { World } from '../world.mjs';
import { globalServiceLocator } from '../../serviceLocator.mjs';
import { PositionComponent, RenderableComponent } from '../components/index.mjs';
import { Renderer } from '../../renderer.mjs';

/**
 * Renders all entities that have a position and a visual representation.
 */
export class RenderSystem {
    private world: World;
    private renderer: Renderer;

    constructor() {
        this.world = globalServiceLocator.world;
        this.renderer = globalServiceLocator.renderer;
    }

    /**
     * Clears the screen and draws all renderable entities.
     */
    public update(): void {
        this.renderer.clear();

        const mapData = globalServiceLocator.state.currentMapData;
        if (mapData) {
            this.renderer.renderMap(mapData);
        }

        const entities = this.world.view(PositionComponent, RenderableComponent);
        
        // Sort entities by layer for correct Z-ordering
        const sortedEntities = [...entities].sort((a, b) => {
            const layerA = a.components[1].layer;
            const layerB = b.components[1].layer;
            return layerA - layerB;
        });

        for (const { components: [position, renderable] } of sortedEntities) {
            this.renderer.drawCharacter(position.x, position.y, renderable.char, renderable.color);
        }
    }
}
