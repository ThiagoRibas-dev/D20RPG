// src/scripts/engine/uiManager.mts
import { calcMod, getSkillRank } from "../engine/dataManager.mjs";
import { ContentItem } from "../engine/entities/contentItem.mjs";
import { PlayerClass } from "../engine/entities/playerCharacter.mjs";
import { UIHolder } from "../engine/entities/uiHolder.mjs";
import { Renderer } from "../engine/renderer.mjs";
import { getRandomInt } from "../engine/utils.mjs";
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
      const race = await races[raceKey].get();
      const raceButton = uiScreens.els['races-selector'].ownerDocument.createElement('button');
      raceButton.textContent = race.name;

      raceButton.onclick = async () => {
        const player = GAME_STATE.player;
        if (!player) {
          console.log("Player is not initialized");
          return;
        }
        updateSelectionInfo(race, uiScreens);
        player.selectedRace = race;
      };
      if (race.icon) {
        const imgElement = uiScreens.els['races-selector'].ownerDocument.createElement("img");
        imgElement.src = race.icon
        raceButton.appendChild(imgElement)
      }
      raceListContainer.appendChild(raceButton)
    }
  }
}

export function updateSelectionInfo(itemData: any, uiScreens: UIHolder) {
  console.log('updateSelectionInfo', itemData);
  const infoContainer = uiScreens.els['selector-info'];
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
        const player = GAME_STATE.player;
        if (!player) {
          console.log("Player is not initialized");
          return;
        }
        // Add class to character with initial level 1
        player.classes.push({
          class: classData,
          level: 1,
          classSkills: classData.class_skills || [],
          hitDice: classData.hit_dice || 6 // Default to d6 if missing
        });

        // Update total level
        player.totalLevel = player.classes
          .reduce((sum, cls) => sum + cls.level, 0);

        const lvlHp = getRandomInt(1, classData.hit_dice);
        player.hitPoints.current += lvlHp;
        player.hitPoints.max += lvlHp;

        updateSelectionInfo(classData, uiScreens);
      };

      if (classData.icon) {
        const imgElement = uiScreens.els['classes-selector'].ownerDocument.createElement("img");
        imgElement.src = classData.icon;
        classButton.appendChild(imgElement);
      }
      classListContainer.appendChild(classButton);
    }
  }
}

export async function displaySkills(contentData: ContentItem, skillListContainer: HTMLElement, uiScreens: UIHolder) {
  skillListContainer.innerHTML = "";

  const player = GAME_STATE.player;
  if (!player) {
    console.log("Player is not initialized");
    return;
  }

  if (player.classes.length === 0) {
    console.error("No class selected");
    GAME_API.creationPrevStep();
    return;
  }
  // Calculate total skill points based on D&D 3.5e Rules
  let totalSkillPoints = player.classes.reduce((sum, cls) => {
    const classPoints = cls.class.skill_points_per_level?.base || 2;
    return sum + classPoints;
  }, 0);

  const intModifier = calcMod(player.stats.int);
  totalSkillPoints += intModifier;

  if (player.totalLevel === 1) {
    totalSkillPoints *= 4; // Only multiply by 4 on first level
  }

  // Initialize remaining points only if not set: This was also creating a bug because if you change screen and come back the points would always default to 0.
  if (player.skillPoints.remaining <= 0) {
    player.skillPoints.remaining = totalSkillPoints;
  }

  uiScreens.els['skill-points-remaining'].innerText =
    `Remaining skill points: ${player.skillPoints.remaining}/${totalSkillPoints}`;

  const skillItems: Node[] = [];
  const skillsCategory = contentData.skills;
  const skillInputs: HTMLInputElement[] = [];
  for (const skillId in skillsCategory) {
    if (skillId === 'get' || skillId === 'type') continue;

    const loadedSkill = await skillsCategory[skillId].get();
    const skillItem = uiScreens.els['skill-container'].ownerDocument.createElement('li');
    const isClassSkill = player.classes.some(cls =>
      cls.classSkills.includes(loadedSkill.name)
    );
    // Calculate maximum ranks based on character level
    const maxRanks = player.totalLevel + 3;
    const displayMax = isClassSkill ? maxRanks : Math.floor(maxRanks / 2);

    const skill: number = player.skillPoints?.allocations?.get(skillId) || 0;

    // Create input element
    const input = skillItem.ownerDocument.createElement("input");
    input.type = 'number';
    input.min = '0';
    input.max = displayMax.toString();
    input.step = isClassSkill ? '1' : '0.5';
    input.pattern = isClassSkill ? '\\d*' : '\\d*\\.?5?'; // Allow .5 values
    input.value = (isClassSkill ? skill : (skill / 2)).toString(); // Display stored value from player allocations, and correctly render "skill ranks", not "points", from allocation.
    input.dataset.isClassSkill = isClassSkill.toString();
    input.id = `${skillId}-skill`;

    // Create labels and indicators
    const label = skillItem.ownerDocument.createElement("label");
    label.htmlFor = input.id;
    label.textContent = loadedSkill.name;

    const typeIndicator = skillItem.ownerDocument.createElement("span");
    typeIndicator.textContent = `(${isClassSkill ? "Class Skill" : "Cross-Class"})`;
    typeIndicator.style.color = isClassSkill ? "#4CAF50" : "#FF9800";

    const maxIndicator = skillItem.ownerDocument.createElement("span");
    maxIndicator.textContent = `Max: ${displayMax}`;
    maxIndicator.style.marginLeft = "1rem";
    maxIndicator.style.opacity = "0.7";

    input.onchange = () => {
      const previousPoints = player.skillPoints.allocations.get(skillId) || 0;
      const rawValue = parseFloat(input.value) || 0;
      const displayedRanks = Math.min(rawValue, displayMax);

      // Calculate POINTS SPENT, not ranks
      const currentPoints = isClassSkill ? displayedRanks : Math.ceil(displayedRanks * 2);
      const pointsDiff = currentPoints - previousPoints
      const newRemaining = player.skillPoints.remaining - pointsDiff

      if (newRemaining < 0) {
        input.value = (previousPoints === 0) ? '0' : isClassSkill ? previousPoints.toString() : (previousPoints / 2).toString();
        return;
      }

      // Update allocations
      player.skillPoints.allocations.set(skillId, currentPoints);
      // Display the new value
      input.value = isClassSkill ? displayedRanks.toFixed(0) : (currentPoints / 2).toFixed(1);

      player.skillPoints.remaining = newRemaining;

      uiScreens.els['skill-points-remaining'].innerText =
        `Remaining skill points: ${newRemaining}/${totalSkillPoints}`;
    };

    skillItem.appendChild(input);
    skillItem.appendChild(typeIndicator);
    skillItem.appendChild(label);
    skillItem.appendChild(maxIndicator);
    skillItems.push(skillItem);
    skillInputs.push(input);
  }

  skillListContainer.append(...skillItems);
}

export function getUsedSkillPoints(inputCheckboxes: { input: HTMLInputElement, checkbox: HTMLInputElement }[]): number {
  let skillPoints = 0
  inputCheckboxes.forEach(ic => {
    const value = parseInt(ic.input.value);
    const isCrossClass = !!ic.checkbox.checked;
    skillPoints += (isCrossClass ? value * 2 : value) || 0;
  })
  return skillPoints
}

export async function updateCampaignList(
  campaignData: ContentItem,
  campaignListContainer: HTMLElement,
  winDoc: any,
  uiScreens: UIHolder,
  selectCampaignCallback: (campaignName: string) => void
) {
  campaignListContainer.innerHTML = '';
  for (var name in campaignData) {
    if (name !== 'type' && name !== 'get') {
      const campaignItem = campaignData[name];
      const campaign = await campaignItem.about.info.get();
      const campaignLi = winDoc.createElement('li');
      campaignLi.classList.add('campaign-item');
      campaignLi.textContent = campaign?.name || name;
      campaignLi.onclick = async () => {
        updateCampaignInfo(name, campaignData, uiScreens);
        uiScreens.btns['campaignSelectBtn'].removeAttribute('style');
        selectCampaignCallback(name)
      };
      campaignListContainer.appendChild(campaignLi);
    }
  }
}

export function showCharacterCreationStep(
  creationStep: number,
  contentData: ContentItem,
  campaignData: ContentItem,
  uiScreens: UIHolder,
  renderer: Renderer,
) {
  const raceListContainer = uiScreens.els['races-selector'];
  const abilityScoresContainer = uiScreens.els['ability-score-selection'];
  const classListContainer = uiScreens.els['classes-selector'];
  const skillListContainer = uiScreens.els['skills-selector'];
  const featListContainer = uiScreens.els['feats-selector'];
  const characterSummary = uiScreens.els['character-summary']; // Get summary screen element
  const btnBack = uiScreens.btns['back-btn'];
  const btnNext = uiScreens.btns['next-btn'];
  const elStepDesc = uiScreens.els['step-description'];
  const elSelectionInfo = uiScreens.els['selector-info'];

  elSelectionInfo.style.display = "none";
  raceListContainer.style.display = "none";
  classListContainer.style.display = "none";
  skillListContainer.style.display = "none";
  abilityScoresContainer.style.display = "none";
  featListContainer.style.display = "none";
  characterSummary.style.display = "none"; // Hide summary screen initially
  btnBack.style.display = "none";
  btnNext.style.display = "none";

  const currentStepName = GAME_STATE.creationSteps[creationStep]; // Get current step name

  switch (currentStepName) {
    case "raceSelection":
      raceListContainer.style.display = '';
      btnNext.style.display = "";
      elStepDesc.innerText = "Choose a Race";
      displayRaces(contentData, raceListContainer, uiScreens);
      break;
    case "abilityScoreSelection":
      abilityScoresContainer.style.display = "";
      btnBack.style.display = "";
      elStepDesc.innerText = "Set Abilities";
      break;
    case "classSelection":
      classListContainer.style.display = "";
      btnBack.style.display = "";
      btnNext.style.display = "";
      elStepDesc.innerText = "Choose a Class";
      displayClasses(contentData, classListContainer, uiScreens);
      break;
    case "skillSelection":
      skillListContainer.style.display = "";
      btnBack.style.display = "";
      btnNext.style.display = "";
      elStepDesc.innerText = "Skills";
      displaySkills(contentData, skillListContainer, uiScreens);
      break;
    case "featSelection":
      featListContainer.style.display = "";
      btnBack.style.display = "";
      btnNext.style.display = "";
      elStepDesc.innerText = "Choose Feats";
      displayFeats(contentData, featListContainer, uiScreens);
      break;
    case "characterSummary": // New case for summary screen
      characterSummary.style.display = "";
      btnBack.style.display = "";
      btnNext.style.display = "none"; // Hide "Next" on summary, maybe "Confirm" instead?
      elStepDesc.innerText = "Character Summary";
      displayCharacterSummary(contentData, campaignData, uiScreens, renderer); // Call summary display function
      break;
    default:
      console.error("Unknown creation step:", currentStepName);
      break;
  }
}

export async function displayFeats(content: ContentItem, featListContainer: HTMLElement, uiScreens: UIHolder) {
  featListContainer.innerHTML = "";
  const feats = await content.feats;
  for (const featKey in feats) {
    if (featKey !== 'type' && featKey !== 'get') {
      const feat = await feats[featKey].get();
      const featButton = uiScreens.els['feats-selector'].ownerDocument.createElement('button');
      featButton.textContent = feat.name;

      featButton.onclick = async () => {
        const player = GAME_STATE.player;
        if (!player) {
          console.log("Player is not initialized");
          return;
        }

        updateSelectionInfo(feat, uiScreens);
        player.feats.push(feat); // Store the feat in GAME_STATE
      };
      if (feat.icon) { // If you decide to add icons for feats later
        const imgElement = uiScreens.els['feats-selector'].ownerDocument.createElement("img");
        imgElement.src = feat.icon
        featButton.appendChild(imgElement)
      }
      featListContainer.appendChild(featButton)
    }
  }
}

export async function displayCharacterSummary(contentData: ContentItem, campaignData: ContentItem, uiScreens: UIHolder, renderer: Renderer) {
  const player = GAME_STATE.player;
  if (!player) {
    console.log("Player is not initialized");
    return;
  }

  const summaryContainer = uiScreens.els['character-summary'];
  summaryContainer.innerHTML = ''; // Clear previous content

  if (!player.selectedRace || player.classes.length === 0) {
    summaryContainer.textContent = "Character data is incomplete.";
    return;
  }

  // --- Race Section ---
  const raceHeader = summaryContainer.ownerDocument.createElement('h3');
  raceHeader.textContent = "Race";
  summaryContainer.appendChild(raceHeader);

  const raceName = summaryContainer.ownerDocument.createElement('p');
  raceName.textContent = player.selectedRace?.name;
  summaryContainer.appendChild(raceName);

  // --- Class Section ---
  const classHeader = summaryContainer.ownerDocument.createElement('h3');
  classHeader.textContent = "Class(es)";
  summaryContainer.appendChild(classHeader);

  const classList = summaryContainer.ownerDocument.createElement('ul');
  player.classes.forEach((classInfo: PlayerClass) => {
    const classItem = summaryContainer.ownerDocument.createElement('li');
    classItem.textContent = `${classInfo.class.name} Level ${classInfo.level}`;
    classList.appendChild(classItem);
  });
  summaryContainer.appendChild(classList);

  // --- Abilities Section ---
  const abilitiesHeader = summaryContainer.ownerDocument.createElement('h3');
  abilitiesHeader.textContent = "Abilities";
  summaryContainer.appendChild(abilitiesHeader);

  const abilitiesList = summaryContainer.ownerDocument.createElement('ul');
  for (const ability in player.stats) {
    const abilityItem = summaryContainer.ownerDocument.createElement('li');
    const mod = calcMod(player.stats[ability]); // Assuming calcMod is imported or defined
    abilityItem.textContent = `${ability.toUpperCase()}: ${player.stats[ability]} (Mod: ${mod})`;
    abilitiesList.appendChild(abilityItem);
  }
  summaryContainer.appendChild(abilitiesList);

  // --- Skills Section ---
  const skillsHeader = summaryContainer.ownerDocument.createElement('h3');
  skillsHeader.textContent = "Skills";
  summaryContainer.appendChild(skillsHeader);

  const skillsList = summaryContainer.ownerDocument.createElement('ul');
  for (const [skillId, points] of player.skillPoints.allocations.entries()) {
    const skillItem = summaryContainer.ownerDocument.createElement('li');
    const skillName = skillId; // Assuming skillId is the skill name, adjust if needed
    const skillRanks = getSkillRank(skillId);
    skillItem.textContent = `${skillName}: Ranks ${skillRanks} (Points: ${points})`;
    skillsList.appendChild(skillItem);
  }
  summaryContainer.appendChild(skillsList);

  // --- Feats Section ---
  const featsHeader = summaryContainer.ownerDocument.createElement('h3');
  featsHeader.textContent = "Feats";
  summaryContainer.appendChild(featsHeader);

  if (player.feats && player.feats.length > 0) {
    const featsList = summaryContainer.ownerDocument.createElement('ul');
    player.feats.forEach((feat: ContentItem) => {
      const featItem = summaryContainer.ownerDocument.createElement('li');
      featItem.textContent = feat.name;
      featsList.appendChild(featItem);
    });
    summaryContainer.appendChild(featsList);
  } else {
    const noFeats = summaryContainer.ownerDocument.createElement('p');
    noFeats.textContent = "No feats selected.";
    summaryContainer.appendChild(noFeats);
  }

  // --- Hit Points Section ---
  const hpHeader = summaryContainer.ownerDocument.createElement('h3');
  hpHeader.textContent = "Hit Points";
  summaryContainer.appendChild(hpHeader);

  const hpDisplay = summaryContainer.ownerDocument.createElement('p');
  hpDisplay.textContent = `Max HP: ${player.hitPoints.max}`; // Just max HP for summary
  summaryContainer.appendChild(hpDisplay);

  // --- Confirm Button (Optional for now, add later if needed) ---
  const confirmButton = summaryContainer.ownerDocument.createElement('button');
  confirmButton.textContent = "Confirm Character";
  confirmButton.onclick = () => {
    const btnBack = uiScreens.btns['back-btn'];
    const btnNext = uiScreens.btns['next-btn'];
    btnBack.style.display = "none";
    btnNext.style.display = "none";

    GAME_STATE.currentScreen = "gameContainer"; // Set game state to gameContainer
    renderer.renderScreen(campaignData, contentData); // Trigger screen render, which will now load the map
    setActiveScreen('gameContainer', uiScreens); // Make sure gameContainer screen is active (visible) - IMPORTANT
  };
  summaryContainer.appendChild(confirmButton);
}