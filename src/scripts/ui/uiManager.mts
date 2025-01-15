// src/scripts/engine/uiManager.mts
import { ContentItem } from "../engine/entities/contentItem.mjs";
import { UIHolder } from "../engine/entities/uiholder.mjs";
import { GAME_API, GAME_STATE } from "../index.mjs";

export async function updateCampaignInfo(campaign: any, campaignData: ContentItem, uiScreens: UIHolder) {
  const nameText = uiScreens.els['campaign-name'];
  const descText = uiScreens.els['campaign-desc'];
  const campaignInfoContainer = uiScreens.els['campaign-info'];
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

export function setActiveScreen(screenId: string, uiScreens: UIHolder) {
  toggleDisplay('startMenu', screenId, uiScreens);
  toggleDisplay('campaignSelection', screenId, uiScreens);
  toggleDisplay('characterCreation', screenId, uiScreens);
  toggleDisplay('gameContainer', screenId, uiScreens);
}

export function toggleDisplay(key: string, screenId: string, uiScreens: UIHolder) {
  const el = uiScreens.els[key];
  el.style.display = (el.id === screenId) ? '' : 'none';
}


export async function displayRaces(content: ContentItem, raceListContainer: HTMLElement, uiScreens: UIHolder) {
  raceListContainer.innerHTML = "";
  const races = await content.races;
  for (const raceKey in races) {
    if (raceKey !== 'type' && raceKey !== 'get') {
      const race = races[raceKey];
      const raceData = await race.get();
      const raceButton = uiScreens.els['races-selector'].ownerDocument.createElement('button');
      raceButton.textContent = raceData.name;

      raceButton.onclick = async () => {
        updateSelectionInfo(raceData, uiScreens);
        GAME_STATE.player.selectedRace = raceData;
      };
      if (raceData.icon) {
        const imgElement = uiScreens.els['races-selector'].ownerDocument.createElement("img");
        imgElement.src = raceData.icon
        raceButton.appendChild(imgElement)
      }
      raceListContainer.appendChild(raceButton)
    }
  }
}

export function updateSelectionInfo(itemData: any, uiScreens: UIHolder) {
  console.log('updateSelectionInfo', itemData);
  const infoContainer = uiScreens.els['selector-info']; // get your container in index
  const elName = uiScreens.els['selected-name'];
  const elDesc = uiScreens.els['selected-desc'];

  elName.innerText = itemData.name;
  elDesc.innerText = itemData.description
  infoContainer.style.display = "";
}

export async function displayClasses(content: ContentItem, classListContainer: HTMLElement, uiScreens: UIHolder) {
  classListContainer.innerHTML = "";
  const classes = await content.classes;
  for (const classKey in classes) {
    if (classKey !== 'type' && classKey !== 'get') {
      const classData = await classes[classKey].get();
      const classButton = uiScreens.els['classes-selector'].ownerDocument.createElement('button');
      classButton.textContent = classData.name;

      classButton.onclick = async () => {
        updateSelectionInfo(classData, uiScreens);
        GAME_STATE.player.selectedClass = classData;
      };
      if (classData.icon) {
        const imgElement = uiScreens.els['classes-selector'].ownerDocument.createElement("img");
        imgElement.src = classData.icon
        classButton.appendChild(imgElement);
      }
      classListContainer.appendChild(classButton);
    }
  }
}

export async function displaySkills(skillListContainer: HTMLElement, uiScreens: UIHolder) {
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
    const skillItem = uiScreens.els['skills-selector'].ownerDocument.createElement('li');
    skillItem.textContent = "A generic Skill or attribute (temporary) that has to load from a JSON, using the name of our skill. " + i
    skillListContainer.appendChild(skillItem);
  }
  console.log("Set Skills");
}