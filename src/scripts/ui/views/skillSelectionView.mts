import { calculateModifier } from '../../engine/utils.mjs';
import { ContentItem } from '../../engine/entities/contentItem.mjs';
import { globalServiceLocator, ServiceLocator } from '../../engine/serviceLocator.mjs';

/**
 * Manages the UI and logic for the skill selection step of character creation.
 */
export class SkillSelectionView {
    private container: HTMLElement;
    private skillPointDisplay: HTMLElement;

    constructor() {
        this.container = ServiceLocator.UI.els['skill-container'];
        this.skillPointDisplay = ServiceLocator.UI.els['skill-points-remaining'];
    }

    /**
     * Renders the interactive list of skills for point allocation.
     * @param contentData The main content data object.
     */
    public async render(contentData: ContentItem): Promise<void> {
        this.container.innerHTML = ""; // Clear previous content
        const player = globalServiceLocator.state.player;

        if (!player || player.classes.length === 0) {
            this.container.innerText = "Error: A class must be selected before assigning skill points.";
            return;
        }

        // --- Calculate Total Skill Points ---
        const intModifier = calculateModifier(player.stats.int);
        const basePointsPerLevel = player.classes.reduce((sum, cls) => sum + (cls.class.skill_points_per_level?.base || 2), 0);
        const totalPointsForLevel = (basePointsPerLevel + intModifier) * (player.totalLevel === 1 ? 4 : 1);

        // Initialize remaining points only if they haven't been set for this level-up.
        if (player.skills.remaining <= 0) {
            player.skills.remaining = totalPointsForLevel;
        }

        this.updateSkillPointDisplay(totalPointsForLevel);

        // --- Render Each Skill ---
        const skillsCategory = contentData.skills;
        for (const skillId in skillsCategory) {
            if (skillId !== 'type' && skillId !== 'get') {
                const loadedSkill = await skillsCategory[skillId].get();
                if (!loadedSkill) continue;

                this.createSkillInputRow(loadedSkill, skillId, totalPointsForLevel);
            }
        }

        this.container.style.display = "";
        this.skillPointDisplay.style.display = "";
    }

    /**
     * Creates a single row in the skill list.
     */
    private createSkillInputRow(skillData: any, skillId: string, totalPointsForLevel: number): void {
        const player = globalServiceLocator.state.player!; // We know player exists from the check in render()
        const skillItem = this.container.ownerDocument.createElement('li');

        const isClassSkill = player.classes.some(cls => cls.classSkills.includes(skillData.name));
        const maxRanks = player.totalLevel + 3;
        const displayMax = isClassSkill ? maxRanks : Math.floor(maxRanks / 2);

        const pointsSpent = player.skills.allocations.get(skillId) || 0;
        const currentRanks = isClassSkill ? pointsSpent : pointsSpent / 2;

        // Create and configure the input element
        const input = skillItem.ownerDocument.createElement("input");
        input.type = 'number';
        input.min = '0';
        input.max = displayMax.toString();
        input.value = currentRanks.toFixed(isClassSkill ? 0 : 1);
        input.id = `${skillId}-skill-input`;

        // --- The Core Logic: The onchange handler ---
        input.onchange = () => {
            const previousPointsSpent = player.skills.allocations.get(skillId) || 0;
            const desiredRanks = Math.min(parseFloat(input.value) || 0, displayMax);

            // Calculate how many POINTS the desired ranks would cost
            const newPointsToSpend = isClassSkill ? Math.round(desiredRanks) : Math.ceil(desiredRanks) * 2;
            const pointsDifference = newPointsToSpend - previousPointsSpent;

            // Check if we can afford this change
            if (player.skills.remaining - pointsDifference < 0) {
                // Revert to the old value if we can't afford it
                input.value = (isClassSkill ? previousPointsSpent : previousPointsSpent / 2).toFixed(isClassSkill ? 0 : 1);
                return;
            }

            // Commit the change
            player.skills.allocations.set(skillId, newPointsToSpend);
            player.skills.remaining -= pointsDifference;

            // Update UI
            input.value = (isClassSkill ? newPointsToSpend : newPointsToSpend / 2).toFixed(isClassSkill ? 0 : 1);
            this.updateSkillPointDisplay(totalPointsForLevel);
        };

        // Create labels and other display elements
        const label = skillItem.ownerDocument.createElement("label");
        label.htmlFor = input.id;
        label.textContent = `${skillData.name} (${skillData.key_ability})`;

        const typeIndicator = skillItem.ownerDocument.createElement("span");
        typeIndicator.textContent = isClassSkill ? "(Class)" : "(Cross)";
        typeIndicator.style.color = isClassSkill ? "#4CAF50" : "#FF9800";
        typeIndicator.style.marginLeft = "10px";

        const rankDisplay = skillItem.ownerDocument.createElement("span");
        rankDisplay.textContent = `Ranks:`;

        skillItem.appendChild(label);
        skillItem.appendChild(typeIndicator);
        skillItem.appendChild(rankDisplay);
        skillItem.appendChild(input);

        this.container.appendChild(skillItem);
    }

    private updateSkillPointDisplay(total: number): void {
        this.skillPointDisplay.innerText = `Remaining skill points: ${globalServiceLocator.state.player!.skills.remaining}/${total}`;
    }

    public show(): void { ServiceLocator.UI.els['skills-selector'].style.display = ''; }
    public hide(): void { ServiceLocator.UI.els['skills-selector'].style.display = 'none'; }
}