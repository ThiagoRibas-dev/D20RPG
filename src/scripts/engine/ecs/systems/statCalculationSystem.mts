import { ISystem } from './system.mjs';
import { World, EntityID } from '../world.mjs';
import { ModifierManager } from '../../modifierManager.mjs';
import { AttributesComponent, ModifiersComponent, StatsComponent } from '../components/index.mjs';

export class StatCalculationSystem {
    private modifierManager: ModifierManager;

    constructor(modifierManager: ModifierManager) {
        this.modifierManager = modifierManager;
    }

    public async recalculateStats(entityId: EntityID, world: World): Promise<void> {
        console.log(`%c--- Recalculating stats for entity ${entityId} ---`, 'color: #88aaff');
        const stats: { [key: string]: number } = {};
        
        // Enforce a strict calculation order to guarantee dependencies are met.
        const baseAttributes = [
            'str', 'dex', 'con', 'int', 'wis', 'cha'
        ];
        const derivedStats = [
            'fortitude_save', 'reflex_save', 'will_save',
            'base_attack_bonus', 'armor_class', 'hit_points', 'skill_points'
        ];

        // Calculate base attributes first.
        for (const stat of baseAttributes) {
            stats[stat] = await this.modifierManager.queryStat(entityId, stat);
        }

        // Then, calculate derived stats which may depend on the base attributes.
        for (const stat of derivedStats) {
            stats[stat] = await this.modifierManager.queryStat(entityId, stat);
        }

        console.log(`%c--- STAT CALCULATION COMPLETE for entity ${entityId} ---`, 'color: #88aaff');
        console.table(stats);

        if (world.hasComponent(entityId, StatsComponent)) {
            const statsComponent = world.getComponent(entityId, StatsComponent);
            if (statsComponent) {
                Object.assign(statsComponent, stats);
            }
        } else {
            world.addComponent(entityId, new StatsComponent(stats));
        }
    }
}
