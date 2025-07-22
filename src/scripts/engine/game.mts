
import {
    ActionBudgetComponent,
    AttributesComponent,
    ClassComponent,
    EquipmentComponent,
    FeatsComponent,
    IdentityComponent,
    InventoryComponent,
    PlayerControlledComponent,
    PositionComponent,
    RenderableComponent,
    SkillsComponent,
    StateComponent,
    TagsComponent
} from "./ecs/components/index.mjs";
import { FeatSlot } from "./entities/featSlot.mjs";
import { ActionExecutionSystem } from "./ecs/systems/actionExecutionSystem.mjs";
import { EffectLifecycleSystem } from "./ecs/systems/effectLifecycleSystem.mjs";
import { RulesEngine } from "./ecs/systems/rulesEngine.mjs";
import { globalServiceLocator } from "./serviceLocator.mjs";
import { updateUI } from "../ui/uiManager.mjs";


export class Game {
  private gameLoopInterval: NodeJS.Timeout | null = null;
  private ecsRulesEngine: RulesEngine;
  private actionExecutionSystem: ActionExecutionSystem;
  private effectLifecycleSystem: EffectLifecycleSystem;

  constructor() {
    this.ecsRulesEngine = new RulesEngine();
    this.actionExecutionSystem = new ActionExecutionSystem();
    this.effectLifecycleSystem = new EffectLifecycleSystem();
  }

  public startCharacterCreation(): void {
    const state = globalServiceLocator.state;
    state.currentScreen = "campaignSelection";

    const world = globalServiceLocator.world;
    const playerId = world.createEntity();
    state.playerId = playerId;

    world.addComponent(playerId, new IdentityComponent("Player"));
    world.addComponent(playerId, new TagsComponent(new Set(['player'])));
    world.addComponent(playerId, new AttributesComponent(new Map()));
    world.addComponent(playerId, new PositionComponent(-1, -1));
    world.addComponent(playerId, new RenderableComponent('@', 'white', 10));
    world.addComponent(playerId, new StateComponent(new Map()));
    world.addComponent(playerId, new PlayerControlledComponent());
    world.addComponent(playerId, new ClassComponent());
    world.addComponent(playerId, new SkillsComponent());
    world.addComponent(playerId, new FeatsComponent([new FeatSlot([], 'Level 1')]));
    world.addComponent(playerId, new InventoryComponent());
    world.addComponent(playerId, new EquipmentComponent());
    world.addComponent(playerId, new ActionBudgetComponent());

    state.creationStep = 0;
    updateUI();
    console.log('startCharacterCreation end', playerId);
  }

  public start(): void {
    console.log("Game started: Initializing Level/Map and game engine behaviors...");
    if (!this.gameLoopInterval) {
      this.gameLoopInterval = setInterval(() => this.gameLoop(), 100);
    }
  }

  public stop(): void {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
      console.log("Game stopped");
    }
  }

  private gameLoop(): void {
    const world = globalServiceLocator.world;

    // 1. Determine possible actions for the current entity
    this.ecsRulesEngine.update(world);

    // 2. Execute any queued actions
    this.actionExecutionSystem.update(world);

    // 3. Render the game state
    globalServiceLocator.renderSystem.update();


    // 5. Effect Lifecycle System
    this.effectLifecycleSystem.update(world);

    // 6. AI System
    globalServiceLocator.aiSystem.update();

    // 7. Interrupt System
    globalServiceLocator.interruptSystem.update();

    // 8. Movement System
    globalServiceLocator.movementSystem.update();

    // 9. Interaction System
    globalServiceLocator.interactionSystem.update();
  }
}
