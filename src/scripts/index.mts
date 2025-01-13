import { ContentLoader } from "./engine/contentLoader.mjs";
import { ContentItem } from "./engine/entities/contentItem.mjs";
import { GameState } from "./engine/entities/gameState.mjs";
import { PlayerCharacter } from "./engine/entities/playerCharacter.mjs";
import { Game } from "./engine/game.mjs";

export let GAME_API: any = { init: false };
export let WIN_DOCUMENT: any;
export let UI_SCREENS: { [key: string]: HTMLElement } = {};

export const GAME_STATE: GameState = {
  currentScreen: "startMenu",
  player: new PlayerCharacter(),
  campaign: "",
  creationStep: 0
};

const contentLoader = new ContentLoader();

async function initializeGame(winObj: any) {
  console.log('INITIALIZING', winObj);

  const contentData = await contentLoader.getContent();
  const campaignData = await contentLoader.getCampaigns()

  const game = new Game(contentData);

  setupGlobals(winObj, campaignData, contentData);

  try {
    console.log('Testing content', contentData);

    const humanData = await contentData.races.human.get();
    console.log('Loaded human data:', humanData?.name);

    const clericData = await contentData.classes.cleric.get();
    console.log('Loaded cleric data:', clericData?.name);
  } catch (error) {
    console.error('Failed to load content:', error);
  }

  game.start();
  renderScreen(campaignData, contentData);
}

function setupGlobals(winObj: any, campaignData: ContentItem, contentData: ContentItem) {
  GAME_API = {
    init: true,
    newGameClick: () => {
      GAME_STATE.currentScreen = "campaignSelection";
      renderScreen(campaignData, contentData);
    },
    selectCampaign: async () => {
      GAME_STATE.currentScreen = "characterCreation";
      GAME_STATE.player = new PlayerCharacter();
      GAME_STATE.creationStep = 0;
      renderScreen(campaignData, contentData);
    },
    creationNextStep: () => {
      GAME_STATE.creationStep = GAME_STATE.creationStep + 1
      renderScreen(campaignData, contentData);
    },
    creationPrevStep: () => {
      GAME_STATE.creationStep = GAME_STATE.creationStep - 1;
      renderScreen(campaignData, contentData);
    },
    continueGameClick: () => {
      console.log("Continue clicked. Loading last save state, if present (placeholder).");
    },
    exitGameClick: () => {
      console.log("Exiting game.");
    },
    gameState: GAME_STATE,
  };

  UI_SCREENS = {
    'startMenu': winObj.document.getElementById('startMenu') as HTMLElement,
    'characterCreation': winObj.document.getElementById('characterCreation') as HTMLElement,
    'campaignSelection': winObj.document.getElementById('campaignSelection') as HTMLElement,
    'gameContainer': winObj.document.getElementById('gameContainer') as HTMLElement
  };
  winObj.gameApi = GAME_API;
  WIN_DOCUMENT = winObj.document;
}

async function updateCampaignInfo(campaign: any, campaignData: ContentItem) {
  const nameText = WIN_DOCUMENT.getElementById('campaign-name') as HTMLParagraphElement;
  const descText = WIN_DOCUMENT.getElementById('campaign-desc') as HTMLParagraphElement;
  const campaignInfoContainer = WIN_DOCUMENT.getElementById('campaign-info') as HTMLDivElement;
  if (campaign && typeof campaign === "string") {
    const currentCampaign = await campaignData[campaign]?.about?.info?.get();

    campaignInfoContainer.style.display = "";
    nameText.innerText = currentCampaign?.name ? currentCampaign.name : "";
    descText.innerText = currentCampaign?.description ? currentCampaign.description : "";
    return;
  }
  campaignInfoContainer.style.display = "none";
  return;
}

async function renderScreen(campaignData: ContentItem, contentData: ContentItem) {
  if (!WIN_DOCUMENT) {
    console.error('WIN_DOCUMENT not initialized');
    return false;
  }

  setActiveScreen(GAME_STATE.currentScreen);
  if (GAME_STATE.currentScreen === 'campaignSelection') {
    await doCampaignSelection(campaignData);
  }
  if (GAME_STATE.currentScreen === 'characterCreation') {
    await doCharacterCreation(contentData);
  }

  console.log("Current Game State:", GAME_STATE.currentScreen);
  return true;
}

async function doCampaignSelection(campaignData: ContentItem) {
  const campaignListContainer = WIN_DOCUMENT.getElementById('campaign-list-ul') as HTMLUListElement;
  campaignListContainer.innerHTML = '';

  const campaignSelectBtn = WIN_DOCUMENT.getElementById('campaignSelectBtn') as HTMLElement;
  campaignSelectBtn.style.display = "none";

  const campaigns = await contentLoader.getCampaigns();
  for (var name in campaigns) {
    if (name !== 'type' && name !== 'get') {
      const campaignItem = campaigns[name];
      const campaign = await campaignItem.about.info.get();

      const campaignLi = WIN_DOCUMENT.createElement('li');
      campaignLi.classList.add('campaign-item');
      campaignLi.textContent = campaign?.name || name;
      campaignLi.onclick = async () => {
        await updateCampaignInfo(name, campaignData);
        WIN_DOCUMENT.getElementById('campaignSelectBtn')?.removeAttribute('style');
      };
      campaignListContainer.appendChild(campaignLi);
    }
  }
}

async function doCharacterCreation(contentData: ContentItem) {
  const raceListContainer = WIN_DOCUMENT.getElementById('races-selector') as HTMLElement;
  const classListContainer = WIN_DOCUMENT.getElementById('classes-selector') as HTMLElement;
  const skillListContainer = WIN_DOCUMENT.getElementById('skills-selector') as HTMLElement;
  const infoContainer = WIN_DOCUMENT.getElementById('selector-info') as HTMLElement;

  const btnBack = WIN_DOCUMENT.getElementById('back-btn') as HTMLButtonElement;
  const btnNext = WIN_DOCUMENT.getElementById('next-btn') as HTMLButtonElement;

  const elStepDesc = WIN_DOCUMENT.getElementById('step-description') as HTMLElement;
  const elSelectionInfo = WIN_DOCUMENT.getElementById('selector-info') as HTMLElement;

  elSelectionInfo.style.display = "none";
  infoContainer.style.display = "none";

  raceListContainer.style.display = "none";
  classListContainer.style.display = "none";
  skillListContainer.style.display = "none";

  if (GAME_STATE.creationStep === 0) {
    raceListContainer.style.display = '';
    classListContainer.style.display = "none";
    skillListContainer.style.display = "none";

    btnBack.style.display = "none";
    btnNext.style.display = "";

    elStepDesc.innerText = "Choose a Race";
    await displayRaces(contentData, raceListContainer);
    return
  }

  if (GAME_STATE.creationStep === 1) {
    classListContainer.style.display = '';
    raceListContainer.style.display = "none";
    skillListContainer.style.display = "none";

    btnBack.style.display = "";
    btnNext.style.display = "";
    elStepDesc.innerText = "Choose a Class";
    await displayClasses(contentData, classListContainer);
    return;
  }
  if (GAME_STATE.creationStep === 2) {
    classListContainer.style.display = "none";
    raceListContainer.style.display = "none";
    skillListContainer.style.display = "";

    btnBack.style.display = "";
    btnNext.style.display = "none";

    elStepDesc.innerText = "Skills";
    await displaySkills(skillListContainer);
    return;
  }
  if (GAME_STATE.creationStep === 3) { //This is only used for an initial display, if there are no previous saves
    elStepDesc.innerText = "Confirm Character Data";
    //Here we display an actual character, from game state data.
    console.log("Character creation is finished. You may go back to the start menu to load your progress", GAME_STATE.player);
    return;
  }
}
async function updateSelectionInfo(itemData: any) {
  console.log('updateSelectionInfo', itemData);
  const infoContainer = WIN_DOCUMENT.getElementById('selector-info') as HTMLElement; // get your container in index
  const elName = WIN_DOCUMENT.getElementById('selected-name') as HTMLHeadingElement;
  const elDesc = WIN_DOCUMENT.getElementById('selected-desc') as HTMLDivElement;

  elName.innerText = itemData.name;
  elDesc.innerText = itemData.description
  infoContainer.style.display = "";
}

async function displayRaces(content: ContentItem, raceListContainer: HTMLElement) {
  raceListContainer.innerHTML = "";
  const races = await content.races;
  for (const raceKey in races) {
    if (raceKey !== 'type' && raceKey !== 'get') {
      const race = races[raceKey];
      const raceData = await race.get();
      const raceButton = WIN_DOCUMENT.createElement('button');
      raceButton.textContent = raceData.name;

      raceButton.onclick = async () => {
        await updateSelectionInfo(raceData)
        GAME_STATE.player.selectedRace = raceData; // set data to this state, temporarily.

      };
      if (raceData.icon) {
        const imgElement = WIN_DOCUMENT.createElement("img");
        imgElement.src = raceData.icon
        raceButton.appendChild(imgElement)
      }
      raceListContainer.appendChild(raceButton)
    }
  }
}

async function displayClasses(content: ContentItem, classListContainer: HTMLElement) {
  classListContainer.innerHTML = "";
  const classes = await content.classes;
  for (const classKey in classes) {
    if (classKey !== 'type' && classKey !== 'get') {
      const classData = await classes[classKey].get();
      const classButton = WIN_DOCUMENT.createElement('button');
      classButton.textContent = classData.name;
      classButton.onclick = async () => {
        await updateSelectionInfo(classData)
        GAME_STATE.player.selectedClass = classData; //Save Class information here for next state
      };
      if (classData.icon) {
        const imgElement = WIN_DOCUMENT.createElement("img");
        imgElement.src = classData.icon
        classButton.appendChild(imgElement);
      }
      classListContainer.appendChild(classButton);
    }
  }
}
async function displaySkills(skillListContainer: HTMLElement) {
  skillListContainer.innerHTML = ""
  if (!GAME_STATE.player.selectedClass) {
    console.error("There was an error with class or race implementation. Reverting");
    GAME_API.creationPrevStep();
    return;
  }
  if (GAME_STATE.player.selectedRace) {
    console.log("Selected race was:", GAME_STATE.player.selectedRace.name)
  } else {
    console.error("Race not found");
    GAME_API.creationPrevStep();
    return;
  }
  if (GAME_STATE.player.selectedClass) {
    console.log("Selected class was:", GAME_STATE.player.selectedClass.name)
  } else {
    console.error("Class not found.");
    GAME_API.creationPrevStep();
    return;
  }

  let availableSkillsPoints = (2 + 10) * 4; // Hardcoded, temporary, placeholder usage of INT
  skillListContainer.innerText = `Remaining skills points to distribute: ${availableSkillsPoints}. Placeholders.`;
  for (let i = 0; i < 10; i++) {
    const skillItem = WIN_DOCUMENT.createElement('li');
    skillItem.textContent = "A generic Skill or attribute (temporary) that has to load from a JSON, using the name of our skill. " + i
    skillListContainer.appendChild(skillItem);
  }
  console.log("Set Skills");
}
function setActiveScreen(screenId: string) {
  for (const id in UI_SCREENS) {
    UI_SCREENS[id].style.display = (id === screenId) ? '' : 'none';
  }
}

initializeGame(window);