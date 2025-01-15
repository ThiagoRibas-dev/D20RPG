import { ContentLoader } from "./engine/contentLoader.mjs";
import { ContentItem } from "./engine/entities/contentItem.mjs";
import { GameState } from "./engine/entities/gameState.mjs";
import { PlayerCharacter } from "./engine/entities/playerCharacter.mjs";
import { Game } from "./engine/game.mjs";

export let GAME_API: any = { init: false };
export let WIN_DOCUMENT: any;
export let UI_SCREENS: {
  els: { [key: string]: HTMLElement },
  inputs: { [key: string]: HTMLInputElement },
  btns: { [key: string]: HTMLButtonElement }
};

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
      GAME_STATE.creationStep = GAME_STATE.creationStep + 1;
      renderScreen(campaignData, contentData);
    },
    creationPrevStep: () => {
      GAME_STATE.creationStep = GAME_STATE.creationStep - 1;
      renderScreen(campaignData, contentData);
    },
    saveAbilities: () => { // Implement save for this specific screen (for example), with new ids and all associated logic, following hardcoded behaviors with json dynamic loading or custom UI (if needed)
      const asEl = getElAbilityScores();
      GAME_STATE.player.stats = {
        str: parseInt(asEl.str.value, 10),
        dex: parseInt(asEl.dex.value, 10),
        con: parseInt(asEl.con.value, 10),
        int: parseInt(asEl.int.value, 10),
        wis: parseInt(asEl.wis.value, 10),
        cha: parseInt(asEl.cha.value, 10),
      }
      GAME_API.creationNextStep();
    },
    rollAbilities: rollAbilities,
    updateAbilityScoreDisplay: updateAbilityScoreDisplay,
    continueGameClick: () => {
      console.log("Continue clicked. Loading last save state, if present (placeholder).");
    },
    exitGameClick: () => {
      console.log("Exiting game.");
    },
    gameState: GAME_STATE,
  };

  UI_SCREENS = {
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

  winObj.gameApi = GAME_API;
  WIN_DOCUMENT = winObj.document;
}

function rollAbilities() {
  const asEl = getElAbilityScores();

  asEl.str.value = roll3d6().toString();
  asEl.dex.value = roll3d6().toString();
  asEl.con.value = roll3d6().toString();
  asEl.int.value = roll3d6().toString();
  asEl.wis.value = roll3d6().toString();
  asEl.cha.value = roll3d6().toString();

  updateAbilityScoreDisplay();
}

function getElAbilityScores(): { [key: string]: HTMLInputElement } {
  return {
    str: UI_SCREENS.inputs.str,
    dex: UI_SCREENS.inputs.dex,
    con: UI_SCREENS.inputs.con,
    int: UI_SCREENS.inputs.int,
    wis: UI_SCREENS.inputs.wis,
    cha: UI_SCREENS.inputs.cha,
  }
}

function pointBuyCost(roll: number) {
  let cost = 0;
  if (roll > 18) {
    cost += (roll - 18) * 3;
    roll = 18;
  }
  if (roll > 13) {
    cost += (roll - 13) * 2;
    roll = 13;
  }
  if (roll > 8) {
    cost += (roll - 8);
  }
  return cost;
}

function roll3d6(): number {
  let roll = 0
  for (let i = 0; i < 3; i++) {
    roll += getRandomInt(1, 6)
  }
  return roll;
}

function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function updateCampaignInfo(campaign: any, campaignData: ContentItem) {
  const nameText = UI_SCREENS.els['campaign-name'];
  const descText = UI_SCREENS.els['campaign-desc'];
  const campaignInfoContainer = UI_SCREENS.els['campaign-info'];
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

async function doCampaignSelection(campaignsData: ContentItem) {
  const campaignListContainer = UI_SCREENS.els['campaign-list-ul'];
  campaignListContainer.innerHTML = '';

  const campaignSelectBtn = UI_SCREENS.btns['campaignSelectBtn'];
  campaignSelectBtn.style.display = "none"

  for (var name in campaignsData) {
    if (name !== 'type' && name !== 'get') {
      const campaignItem = campaignsData[name];
      const campaign = await campaignItem.about.info.get();
      const campaignLi = WIN_DOCUMENT.createElement('li');
      campaignLi.classList.add('campaign-item');
      campaignLi.textContent = campaign?.name || name;
      campaignLi.onclick = async () => {
        await updateCampaignInfo(name, campaignsData)
        UI_SCREENS.btns['campaignSelectBtn'].removeAttribute('style');
      };
      campaignListContainer.appendChild(campaignLi);
    }
  }
}

async function doCharacterCreation(contentData: ContentItem) {
  const raceListContainer = UI_SCREENS.els['races-selector'];
  const abilityScoresContainer = UI_SCREENS.els['ability-score-selection'];
  const classListContainer = UI_SCREENS.els['classes-selector'];
  const skillListContainer = UI_SCREENS.els['skills-selector'];
  const btnBack = UI_SCREENS.btns['back-btn'];
  const btnNext = UI_SCREENS.btns['next-btn'];
  const elStepDesc = UI_SCREENS.els['step-description'];
  const elSelectionInfo = UI_SCREENS.els['selector-info'];

  elSelectionInfo.style.display = "none";
  raceListContainer.style.display = "none";
  classListContainer.style.display = "none";
  skillListContainer.style.display = "none";
  abilityScoresContainer.style.display = "none"

  btnBack.style.display = "none";
  btnNext.style.display = "none";

  if (GAME_STATE.creationStep === 0) {
    raceListContainer.style.display = '';

    btnNext.style.display = "";
    elStepDesc.innerText = "Choose a Race";
    await displayRaces(contentData, raceListContainer);
    return
  }
  if (GAME_STATE.creationStep === 1) {
    abilityScoresContainer.style.display = "";

    btnBack.style.display = "";
    elStepDesc.innerText = "Set Abilities";
    updateAbilityScoreDisplay();
    return;
  }
  if (GAME_STATE.creationStep === 2) {
    classListContainer.style.display = "";

    btnBack.style.display = "";
    btnNext.style.display = "";
    elStepDesc.innerText = "Choose a Class";
    await displayClasses(contentData, classListContainer);
    return;
  }
  if (GAME_STATE.creationStep === 3) {
    skillListContainer.style.display = "";

    btnBack.style.display = "";
    elStepDesc.innerText = "Skills";
    await displaySkills(skillListContainer)
    return;
  }
  if (GAME_STATE.creationStep === 4) {
    elStepDesc.innerText = "Confirm Character Data";
    //Here we display an actual character, from game state data.
    console.log("Character creation is finished. You may go back to the start menu to load your progress", GAME_STATE.player);
    return;
  }
}

function updateAbilityScoreDisplay() {
  if (!WIN_DOCUMENT) {
    console.error('WIN_DOCUMENT not initialized');
    return;
  }
  const asEl: { [key: string]: HTMLInputElement } = getElAbilityScores()
  const totalPoints: number = 32; //default 3.5 point buy system

  const currentTotal = calculateCurrentAbilityPoints(asEl); // call this in `onClick`

  const remainingPointsDisplay = UI_SCREENS.els["remainingPointsDisplay"];
  remainingPointsDisplay.textContent = (totalPoints - currentTotal).toString();
  Object.keys(asEl).map(ability => {
    const baseValue = parseInt(asEl[ability].value) || 0;

    const racialMod = GAME_STATE.player.selectedRace?.ability_score_adjustments[ability] || 0;
    const finalValue = baseValue + (racialMod);

    const costDisplay = UI_SCREENS.els[`${ability}-cost`];
    const modDisplay = UI_SCREENS.els[`${ability}-mod`];
    const finalDisplay = UI_SCREENS.els[`${ability}-total`];

    costDisplay.innerText = pointBuyCost(baseValue).toString(); // Calculating costs using point buy system (using our function above), using an integer value as data input for our previously designed (and working) method/constructor
    modDisplay.innerText = Math.floor((finalValue - 10) / 2).toString(); // Setting the modifier 
    finalDisplay.innerText = `${finalValue} (${baseValue}+${racialMod})`;// Setting final score using those values
  });
}

// Dynamically fetches the cost by using a function from code.
function calculateCurrentAbilityPoints(el: { [key: string]: HTMLInputElement }): number {
  let total = 0;
  Object.values(el).forEach((value, i) => {
    if (i < Object.values(el).length - 1) { total += pointBuyCost(parseInt(value.value)) };
  })
  return total;
}

function updateSelectionInfo(itemData: any) {
  console.log('updateSelectionInfo', itemData);
  const infoContainer = UI_SCREENS.els['selector-info']; // get your container in index
  const elName = UI_SCREENS.els['selected-name'];
  const elDesc = UI_SCREENS.els['selected-desc'];

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
        updateSelectionInfo(raceData);
        GAME_STATE.player.selectedRace = raceData;
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
        updateSelectionInfo(classData);
        GAME_STATE.player.selectedClass = classData;
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

  let availableSkillsPoints = (2 + 10) * 4;
  skillListContainer.innerText = `Remaining skills points to distribute: ${availableSkillsPoints}. Placeholders.`;
  for (let i = 0; i < 10; i++) {
    const skillItem = WIN_DOCUMENT.createElement('li');
    skillItem.textContent = "A generic Skill or attribute (temporary) that has to load from a JSON, using the name of our skill. " + i
    skillListContainer.appendChild(skillItem);
  }
  console.log("Set Skills");
}

function setActiveScreen(screenId: string) {
  toggleDisplay('startMenu', screenId);
  toggleDisplay('campaignSelection', screenId);
  toggleDisplay('characterCreation', screenId);
}

initializeGame(window);

function toggleDisplay(key: string, screenId: string) {
  const el = UI_SCREENS.els[key];
  el.style.display = (el.id === screenId) ? '' : 'none';
}
