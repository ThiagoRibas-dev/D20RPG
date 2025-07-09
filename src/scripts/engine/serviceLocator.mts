import { ContentLoader } from "./contentLoader.mjs";
import { EffectManager } from "./effectManager.mjs";
import { GameState } from "./entities/gameState.mjs";
import { UIHolder } from "./entities/uiHolder.mjs";
import { EventBus } from "./eventBus.mjs";
import { LootFactory } from "./factories/lootFactory.mjs";
import { NpcFactory } from "./factories/npcFactory.mjs";
import { PlayerTurnController } from "./playerTurnController.mjs";
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
    public playerTurnController!: PlayerTurnController;
    public state!: GameState;
    public lootFactory!: LootFactory;
}

// Create the single, global instance that will be used everywhere.
export const globalServiceLocator = new ServiceLocator();
