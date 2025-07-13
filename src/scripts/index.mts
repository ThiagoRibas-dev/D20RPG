import { ContentLoader } from './engine/contentLoader.mjs';
import { EffectManager } from './engine/effectManager.mjs';
import { GameState } from './engine/entities/gameState.mjs';
import { UIHolder } from './engine/entities/uiHolder.mjs';
import { EventBus } from './engine/eventBus.mjs';
import { GameEvents } from './engine/events.mjs';
import { InterruptManager } from './engine/interruptManager.mjs';
import { LootFactory } from './engine/factories/lootFactory.mjs';
import { NpcFactory } from './engine/factories/npcFactory.mjs';
import { Game } from './engine/game.mjs';
import { PlayerTurnController } from './engine/playerTurnController.mjs';
import { Renderer } from './engine/renderer.mjs';
import { RulesEngine } from './engine/rulesEngine.mjs';
import { globalServiceLocator } from './engine/serviceLocator.mjs';
import { TurnManager } from './engine/turnManager.mjs';
import { MOVE_DIRECTIONS } from './engine/utils.mjs';
import { FeedbackManager } from './ui/feedbackManager.mjs';
import { initUIManager, updateUI } from './ui/uiManager.mjs';

async function initializeGame(winObj: any) {
  console.log('INITIALIZING', winObj);

  const winDoc: Document = winObj.document;

  // --- SERVICE REGISTRATION ---
  globalServiceLocator.ui = getUiScreens(winDoc);
  globalServiceLocator.state = getInitialGameState();
  globalServiceLocator.eventBus = new EventBus();
  globalServiceLocator.feedback = new FeedbackManager();
  globalServiceLocator.contentLoader = new ContentLoader();
  globalServiceLocator.effectManager = new EffectManager();
  globalServiceLocator.renderer = new Renderer();
  globalServiceLocator.playerTurnController = new PlayerTurnController();
  globalServiceLocator.lootFactory = new LootFactory();
  globalServiceLocator.npcFactory = new NpcFactory();
  globalServiceLocator.rulesEngine = new RulesEngine();
  globalServiceLocator.turnManager = new TurnManager();
  globalServiceLocator.interruptManager = new InterruptManager();


  // --- SETUP THE CONTROLLER LOGIC (EVENT SUBSCRIPTIONS) ---
  globalServiceLocator.eventBus.subscribe('ui:creation:next_step', () => {
    const state = globalServiceLocator.state;
    state.creationStep++;
    if (state.creationStep >= state.creationSteps.length) {
      state.creationStep = state.creationSteps.length - 1;
    }
    // Re-render the screen to show the new step.
    // We need access to allCampaignData and contentData here.
    updateUI();
  });

  globalServiceLocator.eventBus.subscribe('ui:creation:prev_step', () => {
    const state = globalServiceLocator.state;
    state.creationStep--;
    if (state.creationStep < 0) {
      state.creationStep = 0;
    }

    updateUI();
  });

  globalServiceLocator.eventBus.subscribe(GameEvents.UI_CREATION_CONFIRMED, async () => {
    const state = globalServiceLocator.state;

    if (!state.player || !state.currentCampaignData) {
      console.error("Cannot start game: Player or Campaign data is missing.");
      return;
    }

    console.log("Character creation confirmed. Starting game...");

    // 1. Load the starting map data from the selected campaign.
    // This assumes a 'starting_area' map exists in the campaign.
    const startingMap = await state.currentCampaignData.maps["starting_area"].get();
    if (!startingMap) {
      console.error("Failed to load starting map.");
      return;
    }
    state.currentMapData = startingMap;

    // 2. TODO: Place the player at the map's starting position.
    // You would add a "startPosition": { "x": 1, "y": 3 } to your map JSON
    // and set player.position here.
    // state.player.position = startingMap.startPosition;

    // 3. Change the main screen to the game container.
    state.currentScreen = "gameContainer";

    // 4. Update the entire UI to reflect the new state.
    // This will hide the character creation screen and render the game map.
    globalServiceLocator.ui.btns['back-btn'].style.display = 'none';
    updateUI();
  });

  window.addEventListener('keydown', (event) => {
    const controller = globalServiceLocator.playerTurnController;
    console.log(`Movement : ${event.key}`);
    switch (event.key) {
      case "ArrowUp": controller.onMoveInput(MOVE_DIRECTIONS.UP); break;
      case "ArrowDown": controller.onMoveInput(MOVE_DIRECTIONS.DOWN); break;
      case "ArrowLeft": controller.onMoveInput(MOVE_DIRECTIONS.LEFT); break;
      case "ArrowRight": controller.onMoveInput(MOVE_DIRECTIONS.RIGHT); break;
    }
  });
  updateUI();

  // --- INITIALIZE UI MANAGER ---
  // Now that all services are ready, we can safely initialize the UI views.
  initUIManager();

  new Game().start();
}

function getInitialGameState(): GameState {
  return {
    currentScreen: "startMenu",
    player: null,
    creationStep: 0,
    creationSteps: [
      "raceSelection",
      "abilityScoreSelection",
      "classSelection",
      "skillSelection",
      "featSelection",
      "characterSummary"
    ],
    currentMapData: null,
    currentCampaignData: null,
    npcs: [],
    currentTurn: "",
  };
}

function getUiScreens(winDoc: Document): UIHolder {
  return {
    els: {
      'body': winDoc.body as HTMLElement,
      'startMenu': winDoc.getElementById('startMenu') as HTMLElement,
      'characterCreation': winDoc.getElementById('characterCreation') as HTMLElement,
      'campaignSelection': winDoc.getElementById('campaignSelection') as HTMLElement,
      'gameContainer': winDoc.getElementById('gameContainer') as HTMLElement,
      'races-selector': winDoc.getElementById('races-selector') as HTMLElement,
      'classes-selector': winDoc.getElementById('classes-selector') as HTMLElement,
      'skills-selector': winDoc.getElementById('skills-selector') as HTMLElement,
      'ability-score-selection': winDoc.getElementById('ability-score-selection') as HTMLElement,
      'step-description': winDoc.getElementById('step-description') as HTMLElement,
      'selector-info': winDoc.getElementById('selector-info') as HTMLElement,
      'remainingPointsDisplay': winDoc.getElementById('remainingPointsDisplay') as HTMLElement,
      'campaign-list-ul': winDoc.getElementById('campaign-list-ul') as HTMLUListElement,
      'campaign-info': winDoc.getElementById('campaign-info') as HTMLElement,
      'campaign-name': winDoc.getElementById('campaign-name') as HTMLParagraphElement,
      'campaign-desc': winDoc.getElementById('campaign-desc') as HTMLParagraphElement,
      'selected-name': winDoc.getElementById('selected-name') as HTMLElement,
      'selected-desc': winDoc.getElementById('selected-desc') as HTMLElement,
      'skill-container': winDoc.getElementById('skill-container') as HTMLUListElement,
      'skill-points-remaining': winDoc.getElementById('skill-points-remaining') as HTMLLabelElement,
      'str-cost': winDoc.getElementById(`str-cost`) as HTMLSpanElement,
      'dex-cost': winDoc.getElementById(`dex-cost`) as HTMLSpanElement,
      'con-cost': winDoc.getElementById(`con-cost`) as HTMLSpanElement,
      'int-cost': winDoc.getElementById(`int-cost`) as HTMLSpanElement,
      'wis-cost': winDoc.getElementById(`wis-cost`) as HTMLSpanElement,
      'cha-cost': winDoc.getElementById(`cha-cost`) as HTMLSpanElement,
      'str-total': winDoc.getElementById(`str-total`) as HTMLSpanElement,
      'dex-total': winDoc.getElementById(`dex-total`) as HTMLSpanElement,
      'con-total': winDoc.getElementById(`con-total`) as HTMLSpanElement,
      'int-total': winDoc.getElementById(`int-total`) as HTMLSpanElement,
      'wis-total': winDoc.getElementById(`wis-total`) as HTMLSpanElement,
      'cha-total': winDoc.getElementById(`cha-total`) as HTMLSpanElement,
      'str-mod': winDoc.getElementById(`str-mod`) as HTMLSpanElement,
      'dex-mod': winDoc.getElementById(`dex-mod`) as HTMLSpanElement,
      'con-mod': winDoc.getElementById(`con-mod`) as HTMLSpanElement,
      'int-mod': winDoc.getElementById(`int-mod`) as HTMLSpanElement,
      'wis-mod': winDoc.getElementById(`wis-mod`) as HTMLSpanElement,
      'cha-mod': winDoc.getElementById(`cha-mod`) as HTMLSpanElement,
      'feats-selector': winDoc.getElementById('feats-selector') as HTMLElement,
      'character-summary': winDoc.getElementById('character-summary') as HTMLElement,
      'combatLogPanel': winDoc.getElementById('combatLogPanel') as HTMLElement,
      'characterStatusPanel': winDoc.getElementById('characterStatusPanel') as HTMLElement,
      'actionButtonsPanel': winDoc.getElementById('actionButtonsPanel') as HTMLElement,
      'combatLogText': winDoc.getElementById('combatLogText') as HTMLElement,
      'characterStatusDetails': winDoc.getElementById('characterStatusDetails') as HTMLElement,
      'inventoryScreen': winDoc.getElementById('inventoryScreen') as HTMLElement,
      'equippedItemsContainer': winDoc.getElementById('equippedItemsContainer') as HTMLElement,
      'inventoryItemsContainer': winDoc.getElementById('inventoryItemsContainer') as HTMLElement,
    },
    inputs: {
      "str": winDoc.getElementById("str") as HTMLInputElement,
      "dex": winDoc.getElementById("dex") as HTMLInputElement,
      "con": winDoc.getElementById("con") as HTMLInputElement,
      "int": winDoc.getElementById("int") as HTMLInputElement,
      "wis": winDoc.getElementById("wis") as HTMLInputElement,
      "cha": winDoc.getElementById("cha") as HTMLInputElement,
    },
    btns: {
      'newGameButton': winDoc.getElementById('new-game-btn') as HTMLButtonElement,
      'continueGameButton': winDoc.getElementById('continue-game-btn') as HTMLButtonElement,
      'exitGameButton': winDoc.getElementById('exit-game-btn') as HTMLButtonElement,
      'back-btn': winDoc.getElementById('back-btn') as HTMLButtonElement,
      'next-btn': winDoc.getElementById('next-btn') as HTMLButtonElement,
      'campaignSelectBtn': winDoc.getElementById('campaignSelectBtn') as HTMLButtonElement,
      'spawnTestnpcs': winDoc.getElementById('spawn-npcs-btn') as HTMLButtonElement,
      'attackButton': winDoc.getElementById('attack-btn') as HTMLButtonElement,
      'endTurnButton': winDoc.getElementById('end-turn-btn') as HTMLButtonElement,
      'startCombatButton': winDoc.getElementById('start-combat-btn') as HTMLButtonElement,
      'inventoryButton': winDoc.getElementById('inventory-btn') as HTMLButtonElement,
      'closeInventoryButton': winDoc.getElementById('closeInventoryBtn') as HTMLButtonElement,
    }
  } as UIHolder;
};

try {
  initializeGame(window);
} catch (error) {
  console.error("EXPLODIU", error);
}
