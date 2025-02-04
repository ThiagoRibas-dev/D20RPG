// src/scripts/index.mts
import { ContentLoader } from './engine/contentLoader.mjs';
import { rollAbilities, saveAbilities, updateAbilityScoreDisplay } from './engine/dataManager.mjs';
import { ContentItem } from './engine/entities/contentItem.mjs';
import { GameState } from './engine/entities/gameState.mjs';
import { MapTile } from './engine/entities/mapTile.mjs';
import { Monster } from './engine/entities/monster.mjs';
import { PlayerCharacter } from './engine/entities/playerCharacter.mjs';
import { UIHolder } from './engine/entities/uiHolder.mjs';
import { Game } from './engine/game.mjs';
import { Renderer } from './engine/renderer.mjs';
import { EntityPosition, MOVE_DIRECTIONS } from './engine/utils.mjs';

export let GAME_API: any = { init: false };
export const GAME_STATE: GameState = {
  currentScreen: "startMenu",
  player: null, // Modified: Initialize player to null <---
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
  monsters: [],
  npcs: [],
  currentTurn: "",
};

async function initializeGame(winObj: any) {
  console.log('INITIALIZING', winObj);
  const winDoc = winObj.document;
  const uiScreens: UIHolder = getUiScreens(winObj);
  const contentLoader = new ContentLoader();
  const renderer = new Renderer(uiScreens, winDoc, contentLoader);

  const contentData = await contentLoader.getContent();
  const allCampaignData = await contentLoader.getCampaigns();

  winObj.gameApi = {
    init: true,
    newGameClick: () => {
      GAME_STATE.currentScreen = "campaignSelection";
      renderer.renderScreen(allCampaignData, contentData);
    },
    selectCampaign: async () => {
      GAME_STATE.currentScreen = "characterCreation";
      GAME_STATE.player = new PlayerCharacter(); // Reset player to NULL_PLAYER
      GAME_STATE.creationStep = 0;
      renderer.renderScreen(allCampaignData, contentData);
    },
    creationNextStep: () => {
      console.log('Next step', GAME_STATE.creationStep);
      GAME_STATE.creationStep = GAME_STATE.creationStep + 1;
      if (GAME_STATE.creationStep >= GAME_STATE.creationSteps.length) GAME_STATE.creationStep = GAME_STATE.creationSteps.length - 1; // Use array length
      renderer.renderScreen(allCampaignData, contentData);
    },
    creationPrevStep: () => {
      console.log('Prev step', GAME_STATE.creationStep);
      GAME_STATE.creationStep = GAME_STATE.creationStep - 1;
      if (GAME_STATE.creationStep < 0) GAME_STATE.creationStep = 0;
      renderer.renderScreen(allCampaignData, contentData);
    },
    saveAbilities: () => {
      saveAbilities(uiScreens);
      winObj.gameApi.creationNextStep();
    },
    rollAbilities: () => { rollAbilities(uiScreens) },
    updateAbilityScoreDisplay: () => { updateAbilityScoreDisplay(uiScreens) },
    continueGameClick: () => {
      console.log("Continue clicked. Loading last save state, if present (placeholder).");
    },
    exitGameClick: () => {
      console.log("Exiting game.");
    },
    movePlayer: getFnMovePlayer(contentLoader, renderer, allCampaignData, contentData),
    spawnTestMonsters: async () => {
      GAME_STATE.monsters = []; // Clear monsters array

      const content = await contentLoader.getContent(); // Load content data

      // Load Goblin Prefab and Create Monster Instance
      const goblinPrefab = { ... await content.prefabs.monsters["goblin_warrior"].get() } as Monster;
      if (goblinPrefab) {
        goblinPrefab.position = { x: 8, y: 3 };
        updateTileDefs(contentLoader, goblinPrefab);
        GAME_STATE.monsters.push(goblinPrefab);
      } else {
        console.error("Failed to load goblin prefab: goblin-warrior.json");
      }

      // Load Orc Prefab and Create Monster Instance
      const orcPrefab = { ...await content.prefabs.monsters["orc_warrior"].get() } as Monster;
      if (orcPrefab) {
        orcPrefab.position = { x: 12, y: 6 };
        updateTileDefs(contentLoader, orcPrefab);
        GAME_STATE.monsters.push(orcPrefab);
      } else {
        console.error("Failed to load orc prefab: orc-warrior.json");
      }

      renderer.renderScreen(allCampaignData, contentData);
    },
    startCombat: async () => { // New startCombat function <---
      const player = GAME_STATE.player;
      const monsters = GAME_STATE.monsters;
      const combatLogTextElement = uiScreens.els['combatLogText']; // Get combat log UI element

      if (!player) {
        console.error("No player character in GAME_STATE. Cannot start combat.");
        return;
      }
      if (monsters.length === 0) {
        console.warn("No monsters in GAME_STATE. Spawning test monsters for combat testing.");
        await winObj.gameApi.spawnTestMonsters(); // Spawn test monsters if none exist
        return; // Return after spawning monsters, call startCombat again to begin combat
      }

      combatLogTextElement.innerText = "--- Combat Starts! ---\n\n"; // Clear combat log and add header

      // --- Roll Initiative ---
      const playerInitiative = player.rollInitiative();
      combatLogTextElement.innerText += `Player (${player.selectedRace?.name} ${player.classes[0].class.name}) Initiative: ${playerInitiative}\n`; // Log player initiative

      monsters.forEach(monster => { // Iterate through monsters
        const monsterInitiative = monster.rollInitiative();
        combatLogTextElement.innerText += `${monster.prefabId} Initiative: ${monsterInitiative}\n`; // Log monster initiative
        // Optionally, store initiative roll in monster object itself if needed later
      });

      // --- Determine Turn Order (Player always goes first for MVP) ---
      GAME_STATE.currentTurn = "player"; // Player turn always first for MVP <---
      combatLogTextElement.innerText += `\n--- Player Turn ---\n`; // Indicate player turn in combat log

      renderer.renderScreen(allCampaignData, contentData); // Re-render to update UI (turn indicator, etc. - to be added later)
    },
    gameState: GAME_STATE,
  };
  GAME_API = winObj.gameApi

  window.addEventListener('keydown', (event) => {
    switch (event.key) {
      case "ArrowUp":
        winObj.gameApi.movePlayer(MOVE_DIRECTIONS.UP);
        break;
      case "ArrowDown":
        winObj.gameApi.movePlayer(MOVE_DIRECTIONS.DOWN);
        break;
      case "ArrowLeft":
        winObj.gameApi.movePlayer(MOVE_DIRECTIONS.LEFT);
        break;
      case "ArrowRight":
        winObj.gameApi.movePlayer(MOVE_DIRECTIONS.RIGHT);
        break;
      // ... (default case - can be removed or kept for other key handling) ...
    }
  });

  renderer.renderScreen(allCampaignData, contentData);
  new Game().start();
}

function updateTileDefs(contentLoader: ContentLoader, monsterPrefab: Monster) {
  const tileDefExists: boolean = !!contentLoader.tileDefinitions?.find(def => def.symbol === monsterPrefab.ascii_char);
  if (!tileDefExists) {
    contentLoader.tileDefinitions?.push({
      "symbol": monsterPrefab.ascii_char,
      "name": monsterPrefab.prefabId,
      "isBlocking": true,
      "isTrigger": false,
      "tileColor": monsterPrefab.color,
      "tileChar": monsterPrefab.ascii_char,
    });
  }
}

function getFnMovePlayer(contentLoader: ContentLoader, renderer: Renderer, campaignData: ContentItem, contentData: ContentItem) {
  return async (direction: EntityPosition) => {
    console.log("movePlayer called, direction:", direction);
    const player = GAME_STATE.player;
    if (!player) {
      console.log("Player is not initialized");
      return;
    }

    const currentPlayerPosition = player.position;
    const intendedNewPosition = {
      x: currentPlayerPosition.x + direction.x,
      y: currentPlayerPosition.y + direction.y,
    };

    const mapTiles = GAME_STATE.currentMapData.tiles; // Get map tiles
    const mapHeight = mapTiles.length;
    const mapWidth = mapTiles[0].length;
    const tileDefinitions = contentLoader.tileDefinitions; // Get tile definitions
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
      renderer.renderPlayer(); // Still render player even on blocked move, for animation/feedback if needed
      return;
    }

    const tileSymbolAtNewPosition = mapTiles[intendedNewPosition.y][intendedNewPosition.x];
    const tileDef = tileDefinitions.find(def => def.symbol === tileSymbolAtNewPosition) || tileDefinitions[5];
    const isBlockingTile = tileDef.isBlocking;

    if (isBlockingTile) {
      // Do NOT update player position - wall collision
      console.log("Movement blocked by wall:", tileDef?.name || "Wall");
      renderer.renderPlayer(); // Still render player even on blocked move
      return;
    }

    // Valid move - update player position
    const prevPlayerPosition = { ...player.position }; // Store previous position for redraw
    player.position = intendedNewPosition;

    if (tileDef && tileDef.isTrigger) {
      console.log("Stepped on a trigger tile!");

      const triggerSymbol = tileSymbolAtNewPosition;
      const trigger = GAME_STATE.currentMapData.triggers.find(
        (triggerDef: MapTile) => triggerDef.symbol === triggerSymbol
      );

      if (trigger) {
        const targetMapName = trigger.targetMap;
        const targetLocation = trigger.targetLocation;
        console.log('Hit trigger', targetMapName, targetLocation);

        const newMapData = await GAME_STATE.currentCampaignData?.maps[targetMapName].get();
        if (!newMapData) {
          console.error("Failed to load target map:", targetMapName);
        }

        player.position = targetLocation;
        GAME_STATE.currentMapData = newMapData;
        renderer.renderMapFull(newMapData);
        return; // Exit after map transition
      } else {
        console.error("Trigger definition not found for symbol:", triggerSymbol);
      }
    }

    renderer.redrawTiles(prevPlayerPosition, intendedNewPosition); // Partial redraw for normal movement
    renderer.renderPlayer();
  };
}

function getUiScreens(winObj: any): UIHolder {
  return {
    els: {
      'startMenu': winObj.document.getElementById('startMenu') as HTMLElement,
      'characterCreation': winObj.document.getElementById('characterCreation') as HTMLElement,
      'campaignSelection': winObj.document.getElementById('campaignSelection') as HTMLElement,
      'gameContainer': winObj.document.getElementById('gameContainer') as HTMLElement,
      'races-selector': winObj.document.getElementById('races-selector') as HTMLElement,
      'classes-selector': winObj.document.getElementById('classes-selector') as HTMLElement,
      'skills-selector': winObj.document.getElementById('skills-selector') as HTMLElement,
      'ability-score-selection': winObj.document.getElementById('ability-score-selection') as HTMLElement,
      'step-description': winObj.document.getElementById('step-description') as HTMLElement,
      'selector-info': winObj.document.getElementById('selector-info') as HTMLElement,
      'remainingPointsDisplay': winObj.document.getElementById('remainingPointsDisplay') as HTMLElement,
      'campaign-list-ul': winObj.document.getElementById('campaign-list-ul') as HTMLUListElement,
      'campaign-info': winObj.document.getElementById('campaign-info') as HTMLElement,
      'campaign-name': winObj.document.getElementById('campaign-name') as HTMLParagraphElement,
      'campaign-desc': winObj.document.getElementById('campaign-desc') as HTMLParagraphElement,
      'selected-name': winObj.document.getElementById('selected-name') as HTMLElement,
      'selected-desc': winObj.document.getElementById('selected-desc') as HTMLElement,
      'skill-container': winObj.document.getElementById('skill-container') as HTMLUListElement,
      'skill-points-remaining': winObj.document.getElementById('skill-points-remaining') as HTMLLabelElement,
      'str-cost': winObj.document.getElementById(`str-cost`) as HTMLSpanElement,
      'dex-cost': winObj.document.getElementById(`dex-cost`) as HTMLSpanElement,
      'con-cost': winObj.document.getElementById(`con-cost`) as HTMLSpanElement,
      'int-cost': winObj.document.getElementById(`int-cost`) as HTMLSpanElement,
      'wis-cost': winObj.document.getElementById(`wis-cost`) as HTMLSpanElement,
      'cha-cost': winObj.document.getElementById(`cha-cost`) as HTMLSpanElement,
      'str-total': winObj.document.getElementById(`str-total`) as HTMLSpanElement,
      'dex-total': winObj.document.getElementById(`dex-total`) as HTMLSpanElement,
      'con-total': winObj.document.getElementById(`con-total`) as HTMLSpanElement,
      'int-total': winObj.document.getElementById(`int-total`) as HTMLSpanElement,
      'wis-total': winObj.document.getElementById(`wis-total`) as HTMLSpanElement,
      'cha-total': winObj.document.getElementById(`cha-total`) as HTMLSpanElement,
      'str-mod': winObj.document.getElementById(`str-mod`) as HTMLSpanElement,
      'dex-mod': winObj.document.getElementById(`dex-mod`) as HTMLSpanElement,
      'con-mod': winObj.document.getElementById(`con-mod`) as HTMLSpanElement,
      'int-mod': winObj.document.getElementById(`int-mod`) as HTMLSpanElement,
      'wis-mod': winObj.document.getElementById(`wis-mod`) as HTMLSpanElement,
      'cha-mod': winObj.document.getElementById(`cha-mod`) as HTMLSpanElement,
      'feats-selector': winObj.document.getElementById('feats-selector') as HTMLElement,
      'character-summary': winObj.document.getElementById('character-summary') as HTMLElement,
      'combatLogPanel': winObj.document.getElementById('combatLogPanel') as HTMLElement,
      'characterStatusPanel': winObj.document.getElementById('characterStatusPanel') as HTMLElement,
      'actionButtonsPanel': winObj.document.getElementById('actionButtonsPanel') as HTMLElement,
      'combatLogText': winObj.document.getElementById('combatLogText') as HTMLElement,
      'characterStatusDetails': winObj.document.getElementById('characterStatusDetails') as HTMLElement,
    },
    inputs: {
      "str": winObj.document.getElementById("str") as HTMLInputElement,
      "dex": winObj.document.getElementById("dex") as HTMLInputElement,
      "con": winObj.document.getElementById("con") as HTMLInputElement,
      "int": winObj.document.getElementById("int") as HTMLInputElement,
      "wis": winObj.document.getElementById("wis") as HTMLInputElement,
      "cha": winObj.document.getElementById("cha") as HTMLInputElement,
    },
    btns: {
      'back-btn': winObj.document.getElementById('back-btn') as HTMLButtonElement,
      'next-btn': winObj.document.getElementById('next-btn') as HTMLButtonElement,
      'campaignSelectBtn': winObj.document.getElementById('campaignSelectBtn') as HTMLButtonElement,
      'spawnTestMonsters': winObj.document.getElementById('actionButtonsPanel').querySelector('button:nth-child(1)') as HTMLButtonElement,
      'attackButton': winObj.document.getElementById('actionButtonsPanel').querySelector('button:nth-child(2)') as HTMLButtonElement,
      'endTurnButton': winObj.document.getElementById('actionButtonsPanel').querySelector('button:nth-child(3)') as HTMLButtonElement,
    }
  } as UIHolder;
};

initializeGame(window);