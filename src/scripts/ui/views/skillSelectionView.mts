import { ContentItem } from '../../engine/entities/contentItem.mjs';
import { globalServiceLocator } from '../../engine/serviceLocator.mjs';
import { ClassComponent, SkillsComponent, StatsComponent } from '../../engine/ecs/components/index.mjs';
import { ClassInstance } from '../../engine/ecs/components/classComponent.mjs';

export class SkillSelectionView {
    private container: HTMLElement;
    private skillPointDisplay: HTMLElement;

    constructor() {
        this.container = globalServiceLocator.ui.els['skill-container'];
        this.skillPointDisplay = globalServiceLocator.ui.els['skill-points-remaining'];
    }

    public async render(contentData: ContentItem): Promise<void> {
        this.container.innerHTML = ""; // Clear previous content
        const playerId = globalServiceLocator.state.playerId;
        if (!playerId) return;

        const world = globalServiceLocator.world;
        const classComponent = world.getComponent(playerId, ClassComponent);
        const skillsComponent = world.getComponent(playerId, SkillsComponent);

        if (!classComponent || !skillsComponent || classComponent.classes.length === 0) {
            this.container.innerText = "Error: A class must be selected before assigning skill points.";
            return;
        }

        const statsComponent = world.getComponent(playerId, StatsComponent);
        const totalSkillPoints = statsComponent?.skill_points || 0;
        console.log(`%cSkillSelectionView: Reading totalSkillPoints from StatsComponent: ${totalSkillPoints}`, 'color: #ff99ff');
        skillsComponent.remaining = totalSkillPoints;

        this.updateSkillPointDisplay(totalSkillPoints);

        const skillsCategory = contentData.skills;
        for (const skillId in skillsCategory) {
            if (skillId !== 'type' && skillId !== 'get') {
                const loadedSkill = await skillsCategory[skillId].get();
                if (!loadedSkill) continue;

                await this.createSkillInputRow(loadedSkill, skillId);
            }
        }

        this.container.style.display = "";
        this.skillPointDisplay.style.display = "";
    }

    private async createSkillInputRow(skillData: any, skillId: string): Promise<void> {
        const playerId = globalServiceLocator.state.playerId!;
        const world = globalServiceLocator.world;
        const classComponent = world.getComponent(playerId, ClassComponent)!;
        const skillsComponent = world.getComponent(playerId, SkillsComponent)!;
        
        const skillItem = this.container.ownerDocument.createElement('li');

        const classSkills = await this.getClassSkills(classComponent);
        const isClassSkill = classSkills.includes(skillData.name);
        
        const totalLevel = classComponent.classes.reduce((acc: number, c: ClassInstance) => acc + c.level, 0);
        const maxRanks = totalLevel + 3;
        const displayMax = isClassSkill ? maxRanks : Math.floor(maxRanks / 2);

        const pointsSpent = skillsComponent.allocations.get(skillId) || 0;
        const currentRanks = isClassSkill ? pointsSpent : pointsSpent / 2;

        const input = skillItem.ownerDocument.createElement("input");
        input.type = 'number';
        input.min = '0';
        input.max = displayMax.toString();
        input.value = currentRanks.toFixed(isClassSkill ? 0 : 1);
        input.id = `${skillId}-skill-input`;

        input.onchange = () => {
            const previousPointsSpent = skillsComponent.allocations.get(skillId) || 0;
            const desiredRanks = Math.min(parseFloat(input.value) || 0, displayMax);

            const newPointsToSpend = isClassSkill ? Math.round(desiredRanks) : Math.ceil(desiredRanks) * 2;
            const pointsDifference = newPointsToSpend - previousPointsSpent;

            if (skillsComponent.remaining - pointsDifference < 0) {
                input.value = (isClassSkill ? previousPointsSpent : previousPointsSpent / 2).toFixed(isClassSkill ? 0 : 1);
                return;
            }

            skillsComponent.allocations.set(skillId, newPointsToSpend);
            skillsComponent.remaining -= pointsDifference;

            input.value = (isClassSkill ? newPointsToSpend : newPointsToSpend / 2).toFixed(isClassSkill ? 0 : 1);
            this.updateSkillPointDisplay(skillsComponent.total);
        };

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

    private async getClassSkills(classComponent: ClassComponent): Promise<string[]> {
        const classSkills: string[] = [];
        for (const c of classComponent.classes) {
            const classDataItem = globalServiceLocator.contentLoader.getContentItemById('classes', c.classId);
            if (classDataItem && classDataItem.get) {
                const classData = await classDataItem.get();
                if (classData && classData.class_skills) {
                    classSkills.push(...classData.class_skills);
                }
            }
        }
        return classSkills;
    }

    private updateSkillPointDisplay(total: number): void {
        const world = globalServiceLocator.world;
        const skillsComponent = world.getComponent(globalServiceLocator.state.playerId!, SkillsComponent)!;
        skillsComponent.total = total;
        this.skillPointDisplay.innerText = `Remaining skill points: ${skillsComponent.remaining}/${total}`;
    }

    public show(): void { globalServiceLocator.ui.els['skills-selector'].style.display = ''; }
    public hide(): void { globalServiceLocator.ui.els['skills-selector'].style.display = 'none'; }
}
