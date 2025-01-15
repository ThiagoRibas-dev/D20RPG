// src/scripts/index.mts
import { ContentLoader } from './engine/contentLoader.mjs';
import { rollAbilities, saveAbilities, updateAbilityScoreDisplay } from './engine/dataManager.mjs';
import { GameState } from './engine/entities/gameState.mjs';
import { UIHolder } from './engine/entities/uiholder.mjs';
import { Game } from './engine/game.mjs';
import { Renderer } from './engine/renderer.mjs';

const NULL_PLAYER = { level: 0, selectedClass: null, selectedRace: null, stats: {} };

export let GAME_API: any = { init: false };
export const GAME_STATE: GameState = {
  currentScreen: "startMenu",
  player: NULL_PLAYER,
  campaign: "",
  creationStep: 0
};

async function initializeGame(winObj: any) {
  console.log('INITIALIZING', winObj);
  const winDoc = winObj.document;
  const uiScreens: UIHolder = getUiScreens(winObj);
  const contentLoader = new ContentLoader();
  const renderer = new Renderer(uiScreens, winDoc);

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
      GAME_STATE.player = NULL_PLAYER;
      GAME_STATE.creationStep = 0;
      renderer.renderScreen(campaignData, contentData);
    },
    creationNextStep: () => {
      console.log('Next step', GAME_STATE.creationStep);
      GAME_STATE.creationStep = GAME_STATE.creationStep + 1;
      renderer.renderScreen(campaignData, contentData);
    },
    creationPrevStep: () => {
      console.log('Prev step', GAME_STATE.creationStep);
      GAME_STATE.creationStep = GAME_STATE.creationStep - 1;
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
    gameState: GAME_STATE,
  };
  GAME_API = winObj.gameApi

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
      'campaign-info': winObj.document.getElementById('campaign-info') as HTMLElement,
      'campaign-name': winObj.document.getElementById('campaign-name') as HTMLParagraphElement,
      'campaign-desc': winObj.document.getElementById('campaign-desc') as HTMLParagraphElement,
      'selected-name': winObj.document.getElementById('selected-name') as HTMLElement,
      'selected-desc': winObj.document.getElementById('selected-desc') as HTMLElement,
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
      'campaign-list-ul': winObj.document.getElementById('campaign-list-ul') as HTMLUListElement
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
}

initializeGame(window);