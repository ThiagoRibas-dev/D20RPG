import { World } from '../world.mjs';

export interface ISystem {
    update(world: World, dt: number): void;
}
