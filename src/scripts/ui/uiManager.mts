// src/scripts/engine/uiManager.mts
import { calcMod } from "../engine/dataManager.mjs";
import { ContentItem } from "../engine/entities/contentItem.mjs";
import { UIHolder } from "../engine/entities/uiHolder.mjs";
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

export async function displaySkills(contendData: ContentItem, skillListContainer: HTMLElement, uiScreens: UIHolder) {
  skillListContainer.innerHTML = ""
  const player = GAME_STATE.player;
  const sRace = player.selectedRace;
  if (sRace) {
    console.log("Selected race was:", sRace.name)
  } else {
    console.error("Race not found");
    GAME_API.creationPrevStep();
    return;
  }
  const sClass = player.selectedClass;
  if (sClass) {
    console.log("Selected class was:", sClass);
  } else {
    console.error("Class not found.");
    GAME_API.creationPrevStep();
    return;
  }

  const intMod = calcMod(player.stats.int);
  const classSkillPoints = sClass.skill_points_per_level.base;
  const availableSkillsPoints = (classSkillPoints + intMod) * 4;
  let currentSkillPoints = availableSkillsPoints;
  skillListContainer.innerText = `Remaining skills points to distribute: ${currentSkillPoints}/${availableSkillsPoints}.`;

  const skillsCategory = contendData.skills;
  const skills: string[] = Object.keys(skillsCategory);
  for (let skillId in skills) {
    const loadedSkill = skillsCategory[skillId].get();

    const skillItem: HTMLElement = uiScreens.els['skills-selector'].ownerDocument.createElement('li');

    const input: HTMLInputElement = skillItem.ownerDocument.createElement("input");
    input.type = 'number';
    input.id = `${skillId}-skill`;
    input.min = '0';
    input.max = `${player.level + 3}`;
    input.value = '0';
    input.onchange = () => {
      console.log('Changed', skillId, loadedSkill, currentSkillPoints, input.value);
    }

    const label: HTMLLabelElement = skillItem.ownerDocument.createElement("label");
    label.innerText = loadedSkill.name;
    label.htmlFor = input.id;

    skillItem.appendChild(label);
    skillItem.appendChild(input);
    skillListContainer.appendChild(skillItem);
  }
  console.log("Set Skills");
}