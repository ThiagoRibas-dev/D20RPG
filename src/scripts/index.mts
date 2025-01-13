import { ContentLoader, getIValue } from "./engine/contentLoader.mjs";
import { GameState } from "./engine/entities/gameState";
import { Game } from "./engine/game.mjs";

export let GAME_API: any = { init: false };
export let WIN_DOCUMENT: any;

export const GAME_STATE: GameState = {
  currentScreen: "startMenu",
  player: "",
  campaign: ""
};

const contentLoader = new ContentLoader();

async function initializeGame(winObj: any) {
  console.log('INITIALIZING', winObj);
  setGlobals(winObj);

  const content = await contentLoader.getContent();
  const game = new Game(content); // Creating a Game object with those methods

  try {
    console.log('Testing content', content);

    const humanData = await getIValue(content.races.human);
    console.log('Loaded human data:', humanData?.name);

    const clericData = await getIValue(content.classes.cleric);
    console.log('Loaded cleric data:', clericData?.name);

  } catch (error) {
    console.error('Failed to load content:', error);
  }

  game.start(); //Load a default campaign data, if available
  renderScreen(); // Render main screen, using those states to test everything (using data in that initial, generated game state)
}
// Using the global window, document variables so the code can interface dynamically with the html and create our dynamic interface (following previously implemented/designed methods):
function setGlobals(winObj: any) {
  GAME_API = {
    init: true,
    newGameClick: () => {
      GAME_STATE.currentScreen = "campaignSelection";
      renderScreen(); // Call to re-render our UI to display our Campaign Selection Screen
    },
    continueGameClick: () => {
      console.log("Continue clicked. Loading last save state, if present (placeholder).");
    },
    exitGameClick: () => {
      console.log("Exiting game.");
    },
    gameState: GAME_STATE, // Send data of the state
    renderScreen: renderScreen,
  };
  winObj.gameApi = GAME_API; // set it into our main window context, so it can be accessible using other files in that html.
  WIN_DOCUMENT = winObj.document;
}

async function renderScreen() {
  if (!WIN_DOCUMENT) {
    console.error('WIN_DOCUMENT not initialized');
    return false;
  }

  const startMenuDiv = WIN_DOCUMENT.getElementById('startMenu') as HTMLElement;
  const charCreationDiv = WIN_DOCUMENT.getElementById('characterCreation') as HTMLElement;
  const campaignSelectDiv = WIN_DOCUMENT.getElementById('campaignSelection') as HTMLElement;
  const gameDiv = WIN_DOCUMENT.getElementById('gameContainer') as HTMLElement;

  if (GAME_STATE.currentScreen === 'startMenu') {
    startMenuDiv.style.display = "";
    charCreationDiv.style.display = "none";
    campaignSelectDiv.style.display = "none";
    gameDiv.style.display = "none";
  }
  else if (GAME_STATE.currentScreen === "characterCreation") {
    startMenuDiv.style.display = "none";
    charCreationDiv.style.display = "";
    campaignSelectDiv.style.display = "none";
    gameDiv.style.display = "none";
  }
  else if (GAME_STATE.currentScreen === 'campaignSelection') {
    startMenuDiv.style.display = "none";
    charCreationDiv.style.display = "none";
    campaignSelectDiv.style.display = "";
    gameDiv.style.display = "none";
    const campaignListContainer = WIN_DOCUMENT.getElementById('campaigns-container') as HTMLDivElement;
    campaignListContainer.innerHTML = '';

    const campaigns = await contentLoader.getCampaigns();
    const campaignFolders = Object.keys(campaigns);
    console.log('availableCampaigns', campaignFolders)

    if (campaignFolders) {
      campaignFolders.forEach((campaign: string) => {
        const campaignItem = WIN_DOCUMENT.createElement('div');
        campaignItem.classList.add('campaign-item');
        campaignItem.textContent = campaign; // Adding this now
        campaignItem.onclick = () => {
          GAME_STATE.campaign = campaign;
          WIN_DOCUMENT.getElementById('campaignSelectBtn')?.removeAttribute('style');
        }
        campaignListContainer.appendChild(campaignItem);
      })
    }
  }
  else if (GAME_STATE.currentScreen === "game") {
    startMenuDiv.style.display = "none";
    charCreationDiv.style.display = "none";
    campaignSelectDiv.style.display = "none";
    gameDiv.style.display = "";
  }

  console.log("Current Game State:", GAME_STATE.currentScreen); // A test output to see the flow
  return true; // Use this for testing UI methods
}

initializeGame(window); // Now passing window for making use of global object from our js.