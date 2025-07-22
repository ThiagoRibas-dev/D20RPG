import { FeedbackManager } from "../ui/feedbackManager.mjs";
import { ContentLoader } from "./contentLoader.mjs";
import { AISystem } from "./ecs/systems/aiSystem.mjs";
import { InteractionSystem } from "./ecs/systems/interactionSystem.mjs";
import { InterruptSystem } from "./ecs/systems/interruptSystem.mjs";
import { MovementSystem } from "./ecs/systems/movementSystem.mjs";
import { RenderSystem } from "./ecs/systems/renderSystem.mjs";
import { StatCalculationSystem } from "./ecs/systems/statCalculationSystem.mjs";
import { World } from "./ecs/world.mjs";
import { EffectManager } from "./effectManager.mjs";
import { GameState } from "./entities/gameState.mjs";
import { UIHolder } from "./entities/uiHolder.mjs";
import { EventBus } from "./eventBus.mjs";
import { LootFactory } from "./factories/lootFactory.mjs";
import { NpcFactory } from "./factories/npcFactory.mjs";
import { Game } from "./game.mjs";
import { InteractionManager } from "./interactionManager.mjs";
import { MapManager } from "./mapManager.mjs";
import { ModifierManager } from "./modifierManager.mjs";
import { PlayerTurnController } from "./playerTurnController.mjs";
import { Renderer } from "./renderer.mjs";
import { ScriptingService } from "./scriptingService.mjs";
import { TargetingManager } from "./targetingManager.mjs";
import { TileStateManager } from "./tileStateManager.mjs";
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
    public effectManager!: EffectManager;
    public turnManager!: TurnManager;
    public renderer!: Renderer;
    public ui!: UIHolder;
    public eventBus!: EventBus;
    public npcFactory!: NpcFactory;
    public playerTurnController!: PlayerTurnController;
    public state!: GameState;
    public lootFactory!: LootFactory;
    public feedback!: FeedbackManager;
    public modifierManager!: ModifierManager;
    public tileStateManager!: TileStateManager;
    public interactionManager!: InteractionManager;
    public scriptingService!: ScriptingService;
    public world!: World;
    public targetingManager!: TargetingManager;
    public aiSystem!: AISystem;
    public interruptSystem!: InterruptSystem;
    public renderSystem!: RenderSystem;
    public movementSystem!: MovementSystem;
    public interactionSystem!: InteractionSystem;
    public statCalculationSystem!: StatCalculationSystem;
    public game!: Game;
    public mapManager!: MapManager;
}

// Create the single, global instance that will be used everywhere.
export const globalServiceLocator = new ServiceLocator();
