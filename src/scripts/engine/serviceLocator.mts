import { ContentLoader } from "./contentLoader.mjs";
import { EffectManager } from "./effectManager.mjs";
import { GameState } from "./entities/gameState.mjs";
import { UIHolder } from "./entities/uiHolder.mjs";
import { EventBus } from "./eventBus.mjs";
import { NpcFactory } from "./factories/npcFactory.mjs";
import { Renderer } from "./renderer.mjs";
import { RulesEngine } from "./rulesEngine.mjs";
import { TurnManager } from "./turnManager.mjs";

/**
 * A simple Service Locator pattern implementation.
 * Provides a central, global point of access for all major engine systems.
 * This avoids the need to pass service instances through multiple function calls.
 */
class ServiceLocator {
    // We use definite assignment assertions (!) because these will be
    // initialized once at startup.
    public contentLoader!: ContentLoader;
    public rulesEngine!: RulesEngine;
    public effectManager!: EffectManager;
    public turnManager!: TurnManager;
    public renderer!: Renderer;
    public ui!: UIHolder;
    public eventBus!: EventBus;
    public npcFactory!: NpcFactory;
    public state!: GameState;

    /**
     * Provides access to the ContentLoader instance.
     */
    public static get ContentLoader(): ContentLoader {
        return globalServiceLocator.contentLoader;
    }

    /**
     * Provides access to the RulesEngine instance.
     */
    public static get RulesEngine(): RulesEngine {
        return globalServiceLocator.rulesEngine;
    }

    /**
     * Provides access to the EffectManager instance.
     */
    public static get EffectManager(): EffectManager {
        return globalServiceLocator.effectManager;
    }

    /**
     * Provides access to the TurnManager instance.
     */
    public static get TurnManager(): TurnManager {
        return globalServiceLocator.turnManager;
    }

    /**
     * Provides access to the Renderer instance.
     */
    public static get Renderer(): Renderer {
        return globalServiceLocator.renderer;
    }

    /**
     * Provides access to the UIHolder instance.
     */
    public static get UI(): UIHolder {
        return globalServiceLocator.ui;
    }

    /**
    * Provides access to the global EventBus instance.
    */
    public static get EventBus(): EventBus {
        return globalServiceLocator.eventBus;
    }

    /**
     * Provides access to the global NpcFactory object.
     */
    public static get NpcFactory(): NpcFactory {
        return globalServiceLocator.npcFactory;
    }

    /**
     * Provides access to the global GameState object.
     */
    public static get State(): GameState {
        return globalServiceLocator.state;
    }
}

// Create the single, global instance that will be used everywhere.
export const globalServiceLocator = new ServiceLocator();

// Export the class as a type and for static access.
export { ServiceLocator };

