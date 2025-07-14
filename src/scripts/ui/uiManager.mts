import { ContentItem } from "../engine/entities/contentItem.mjs";
import { PlayerCharacter } from "../engine/entities/playerCharacter.mjs";
import { GameEvents } from "../engine/events.mjs";
import { globalServiceLocator } from "../engine/serviceLocator.mjs";
import { setActiveScreen } from "./uiHelpers.mjs";
import { AbilityScoreSelectionView } from "./views/abilityScoreSelectionView.mjs";
import { CampaignSelectionView } from "./views/campaignSelectionView.mjs";
import { CharacterSummaryView } from "./views/characterSummaryView.mjs";
import { ClassSelectionView } from "./views/classSelectionView.mjs";
import { FeatSelectionView } from "./views/featSelectionView.mjs";
import { InventoryView } from "./views/inventoryView.mjs";
import { RaceSelectionView } from "./views/raceSelectionView.mjs";
import { SkillSelectionView } from "./views/skillSelectionView.mjs";
import { InterruptPromptView } from "./views/interruptPromptView.mjs";

// --- VIEW INSTANCES ---
// Create one instance of each view to manage its respective UI section.
let campaignSelectionView: CampaignSelectionView;
let raceSelectionView: RaceSelectionView;
let classSelectionView: ClassSelectionView;
let abilityScoreSelectionView: AbilityScoreSelectionView;
let featSelectionView: FeatSelectionView;
let skillSelectionView: SkillSelectionView;
let characterSummaryView: CharacterSummaryView;
let inventoryView: InventoryView;
let interruptPromptView: InterruptPromptView;

/**
 * Initializes all the UI View classes.
 * This MUST be called after all services are registered in the ServiceLocator.
 */
export function initUIManager(): void {
  campaignSelectionView = new CampaignSelectionView();
  raceSelectionView = new RaceSelectionView();
  classSelectionView = new ClassSelectionView();
  abilityScoreSelectionView = new AbilityScoreSelectionView();
  featSelectionView = new FeatSelectionView();
  skillSelectionView = new SkillSelectionView();
  characterSummaryView = new CharacterSummaryView();
  inventoryView = new InventoryView();
  interruptPromptView = new InterruptPromptView();

  // --- Wire up events controlled by the UI Manager ---
  const state = globalServiceLocator.state;
  if (!state) {
    console.error('ERROR! STATE NOT LOADED');
    return;
  }

  const eventBus = globalServiceLocator.eventBus;
  if (!eventBus) {
    console.error('ERROR! EVENT BUS NOT LOADED');
    return;
  }

  // Screen/Menu Navigation
  setBtnOnCLick('newGameButton', () => {
    state.currentScreen = "campaignSelection";
    updateUI();
  });
  setBtnOnCLick('campaignSelectBtn', () => {
    state.currentScreen = "characterCreation";
    state.player = new PlayerCharacter();
    state.creationStep = 0;
    updateUI();
  });
  setBtnOnCLick('back-btn', () => eventBus.publish('ui:creation:prev_step'));
  setBtnOnCLick('next-btn', () => {
    if (state.creationSteps[state.creationStep] === 'abilityScoreSelection') {
      abilityScoreSelectionView.saveAbilities();
    }
    eventBus.publish('ui:creation:next_step');
  });

  eventBus.subscribe(GameEvents.PLAYER_INTERRUPT_PROMPT, (event) => {
    interruptPromptView.render(event.data);
  });


  const ui = globalServiceLocator.ui;
  // In-Game UI
  ui.btns['inventoryButton'].onclick = () => inventoryView.show();
  ui.btns['closeInventoryButton'].onclick = () => inventoryView.hide();

  // Debug Buttons
  ui.btns['spawnTestnpcs'].onclick = async () => {
    state.npcs = [];
    const goblin = await globalServiceLocator.npcFactory.create('goblin_warrior', 'monsters', { x: 8, y: 3 });
    if (goblin) state.npcs.push(goblin);
    globalServiceLocator.renderer.renderMapFull(state.currentMapData);
  };
  ui.btns['startCombatButton'].onclick = () => {
    if (!state.player) return;
    globalServiceLocator.turnManager.startCombat([state.player, ...state.npcs]);
  };

  console.log("UI Manager and all its views have been initialized.");
}

/**
 * The main UI controller function. It reads the current game state
 * and calls the appropriate view or helper to update the screen.
 * This is the single entry point for all UI changes.
 */
export async function updateUI() {
  const state = globalServiceLocator.state;
  const allCampaignData = await globalServiceLocator.contentLoader.getCampaigns();
  const contentData = await globalServiceLocator.contentLoader.getContent();

  // Set the active top-level screen container (startMenu, characterCreation, gameContainer)
  setActiveScreen(state.currentScreen);

  console.log("Updating UI for screen:", state.currentScreen);

  // Call the specific logic for the current screen
  if (state.currentScreen === 'campaignSelection') {
    campaignSelectionView.show();
    campaignSelectionView.render(allCampaignData);
  }
  else if (state.currentScreen === 'characterCreation') {
    showCharacterCreationStep(contentData, allCampaignData);
  }
  else if (state.currentScreen === 'gameContainer') {
    const mapData = state.currentMapData;
    if (mapData) globalServiceLocator.renderer.renderMapFull(mapData);
  }
}

export function toggleDisplay(key: string, screenId: string) {
  const uiScreens = globalServiceLocator.ui;
  const el = uiScreens.els[key];
  el.style.display = (el.id === screenId) ? '' : 'none';
}

/**
 * Main controller function for the character creation process.
 * It hides all steps and then shows only the current one, delegating the
 * rendering logic to the appropriate View class.
 */
export function showCharacterCreationStep(contentData: ContentItem, campaignData: ContentItem) {
  const uiScreens = globalServiceLocator.ui;
  const creationStep = globalServiceLocator.state.creationStep;
  const currentStepName = globalServiceLocator.state.creationSteps[creationStep];

  // --- Hide all selector views first ---
  raceSelectionView.hide();
  classSelectionView.hide();
  skillSelectionView.hide();
  abilityScoreSelectionView.hide();
  characterSummaryView.hide();
  featSelectionView.hide();
  globalServiceLocator.ui.els['selector-info'].style.display = "none";

  switch (currentStepName) {
    case "raceSelection": raceSelectionView.show(); raceSelectionView.render(contentData); break;
    case "abilityScoreSelection": abilityScoreSelectionView.show(); abilityScoreSelectionView.render(); break;
    case "classSelection": classSelectionView.show(); classSelectionView.render(contentData); break;
    case "skillSelection": skillSelectionView.show(); skillSelectionView.render(contentData); break;
    case "characterSummary": characterSummaryView.show(); characterSummaryView.render(); break;
    case "featSelection": featSelectionView.show(); featSelectionView.render(contentData); break;
    default:
      console.error("Unknown creation step:", currentStepName);
      break;
  }

  // --- Configure navigation buttons ---
  uiScreens.btns['back-btn'].style.display = (creationStep > 0) ? "" : "none";
  uiScreens.btns['next-btn'].style.display = (creationStep < globalServiceLocator.state.creationSteps.length - 1) ? "" : "none";
}
function setBtnOnCLick(btnId: string, callback: () => void) {
  const ui = globalServiceLocator.ui;
  if (!ui || !ui.btns) {
    console.error('ERROR! UI BTNS NOT LOADED');
    return;
  }
  if (!ui.btns[btnId]) {
    console.error(`ERROR! ${btnId} NOT FOUND`);
    return;
  }
  ui.btns[btnId].onclick = () => {
    console.log(`CLicked ${btnId}.`);
    callback()
  };
}
