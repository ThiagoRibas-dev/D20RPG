// src/scripts/index.mts
import { ContentLoader } from './engine/contentLoader.mjs';
import { rollAbilities, saveAbilities, updateAbilityScoreDisplay } from './engine/dataManager.mjs';
import { GameState } from './engine/entities/gameState.mjs';
import { UIHolder } from './engine/entities/uiHolder.mjs';
import { Game } from './engine/game.mjs';
import { Renderer } from './engine/renderer.mjs';
import { MOVE_DIRECTIONS, PlayerPosition } from './engine/utils.mjs';

const NULL_PLAYER = {
  classes: [],
  totalLevel: 0,
  selectedRace: null,
  stats: {},
  hitPoints: { current: 0, max: 0 },
  skillPoints: { remaining: 0, allocations: new Map() },
  feats: [],
  position: { x: 1, y: 1 },
};

export let GAME_API: any = { init: false };
export const GAME_STATE: GameState = {
  currentScreen: "startMenu",
  player: NULL_PLAYER,
  campaign: "",
  creationStep: 0,
  creationSteps: [ // Define creation steps here
    "raceSelection",
    "abilityScoreSelection",
    "classSelection",
    "skillSelection",
    "featSelection",
    "characterSummary"
  ],
  currentMapData: null,
};

async function initializeGame(winObj: any) {
  console.log('INITIALIZING', winObj);
  const winDoc = winObj.document;
  const uiScreens: UIHolder = getUiScreens(winObj);
  const contentLoader = new ContentLoader();
  const renderer = new Renderer(uiScreens, winDoc, contentLoader);

  const contentData = await contentLoader.getContent();
  const campaignData = await contentLoader.getCampaigns();

  winObj.gameApi = {
    init: true,
    newGameClick: () => {
      GAME_STATE.currentScreen = "campaignSelection";
      renderer.renderScreen(campaignData, contentData);
    },
    selectCampaign: async () => {
      GAME_STATE.currentScreen = "characterCreation";
      GAME_STATE.player = { ...NULL_PLAYER }; // Reset to initial state
      GAME_STATE.creationStep = 0;
      renderer.renderScreen(campaignData, contentData);
    },
    creationNextStep: () => {
      console.log('Next step', GAME_STATE.creationStep);
      GAME_STATE.creationStep = GAME_STATE.creationStep + 1;
      if (GAME_STATE.creationStep >= GAME_STATE.creationSteps.length) GAME_STATE.creationStep = GAME_STATE.creationSteps.length - 1; // Use array length
      renderer.renderScreen(campaignData, contentData);
    },
    creationPrevStep: () => {
      console.log('Prev step', GAME_STATE.creationStep);
      GAME_STATE.creationStep = GAME_STATE.creationStep - 1;
      if (GAME_STATE.creationStep < 0) GAME_STATE.creationStep = 0;
      renderer.renderScreen(campaignData, contentData);
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
    movePlayer: (direction: PlayerPosition) => {
      console.log("movePlayer called, direction:", direction);
      const currentPlayerPosition = GAME_STATE.player.position;
      const intendedNewPosition = { // Calculate intended new position
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

      if (!isValidMovement) {
        // Do NOT update player position - boundary collision
        console.log("Movement blocked by map boundary");
        return;
      }

      const tileSymbolAtNewPosition = mapTiles[intendedNewPosition.y][intendedNewPosition.x];
      const tileDef = tileDefinitions?.find(def => def.symbol === tileSymbolAtNewPosition);
      const isBlockingTile = tileDef ? tileDef.isBlocking : false;

      if (isBlockingTile) {
        // Do NOT update player position - wall collision
        console.log("Movement blocked by wall:", tileDef?.name || "Wall");
        return;
      }

      // Valid move - update player position
      GAME_STATE.player.position = intendedNewPosition;

      if (tileDef && tileDef.isTrigger) {
        console.log("Stepped on a trigger tile!");

        const triggerSymbol = tileSymbolAtNewPosition;
        const trigger = GAME_STATE.currentMapData.triggers.find(
          (triggerDef: any) => triggerDef.symbol === triggerSymbol
        );

        if (trigger) {
          const targetMapName = trigger.targetMap;
          const targetLocation = trigger.targetLocation;

          contentLoader.loadMap(GAME_STATE.campaign, targetMapName)
            .then(newMapData => {
              if (newMapData) {
                GAME_STATE.currentMapData = newMapData;
                GAME_STATE.player.position = targetLocation;
                renderer.renderScreen(campaignData, contentData); // Re-render with new map
              } else {
                console.error("Failed to load target map:", targetMapName);
              }
            })
            .catch(error => {
              console.error("Error loading target map:", targetMapName, error);
            });
          return;
        } else {
          console.error("Trigger definition not found for symbol:", triggerSymbol);
        }
      }

      renderer.renderScreen(campaignData, contentData); // Re-render for normal movement (or after transition)
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

  renderer.renderScreen(campaignData, contentData);
  new Game().start();
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
    }
  };
};

initializeGame(window);