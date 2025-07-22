/**
 * Represents a single class level taken by an entity.
 */
export interface ClassInstance {
    classId: string;
    level: number;
}

/**
 * A component that holds all the classes and levels for an entity.
 */
export class ClassComponent {
    constructor(public classes: ClassInstance[] = []) {}
}
