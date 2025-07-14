export const GameEvents = {
  // UI Events
  UI_CREATION_CONFIRMED: 'ui:creation:confirmed',
  UI_MAP_CLICKED: 'ui:map:clicked',
  UI_INPUT_CANCELED: 'ui:input:canceled',
  UI_BUTTON_ATTACK_CLICKED: 'ui:button:attack_clicked',
  PLAYER_INTERRUPT_PROMPT: 'player:interrupt:prompt',
  UI_INTERRUPT_RESOLVED: 'ui:interrupt:resolved',

  // Action Events
  ACTION_ATTACK_DECLARED: 'action:attack:declared',
  ACTION_ATTACK_RESOLVED: 'action:attack:resolved',
  ACTION_MOVE_DECLARED: 'action:move:declared',
  ACTION_MOVE_BLOCKED: 'action:move:blocked',
  ACTION_DAMAGE_RESOLVED: 'action:damage:resolved',
  ACTION_ATTACK_BEFORE_ROLL: 'action:attack:before_roll',
  ACTION_DAMAGE_BEFORE_ROLL: 'action:damage:before_roll',
  ACTION_PROVOKES_AOO: 'action:provokes_aoo',
  ACTION_USE_POWER_DECLARED: 'action:use_power:declared',

  // Combat Events
  COMBAT_START: 'combat:start',
  COMBAT_END: 'combat:end',
  COMBAT_ROUND_START: 'combat:round:start',
  COMBAT_TURN_START: 'combat:turn:start',
  COMBAT_TURN_END: 'combat:turn:end',
  COMBAT_TURN_SKIPPED: 'combat:turn:skipped',

  // Character/Entity Events
  ITEM_STATE_CHANGED: 'item:state:changed',
  CHARACTER_DIED: 'character:died',
  CHARACTER_HP_CHANGED: 'character:hp:changed',
  CHARACTER_TAKES_DAMAGE: 'character:takes_damage',
  CHARACTER_EFFECT_APPLIED: 'character:effect:applied',
  CHARACTER_EFFECT_REMOVED: 'character:effect:removed',
  ENTITY_MOVED: 'entity:moved',
  ENTITY_STATS_CALCULATED: 'entity:stats:calculated',
} as const;

/**
 * Represents a structured event within the game engine.
 * It contains the data relevant to the event and can be cancelled
 * by a listener to prevent further processing.
 */
export class GameEvent {
    public readonly name: string;
    public data: any;
    private _isCancelled: boolean = false;

    constructor(name: string, data: any) {
        this.name = name;
        this.data = data;
    }

    /**
     * Marks the event as cancelled, preventing further listeners from executing.
     */
    public cancel(): void {
        this._isCancelled = true;
    }

    /**
     * Checks if the event has been cancelled.
     */
    public get isCancelled(): boolean {
        return this._isCancelled;
    }
}
