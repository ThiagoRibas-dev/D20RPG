export type EntityID = string;

export interface Component {}

type ComponentClass<T extends Component> = new (...args: any[]) => T;

export class World {
    private nextEntityID: number = 0;
    private entities: Set<EntityID> = new Set();
    private components: Map<ComponentClass<any>, Map<EntityID, Component>> = new Map();

    public createEntity(): EntityID {
        const entityId = 'entity-' + this.nextEntityID++;
        this.entities.add(entityId);
        return entityId;
    }

    public destroyEntity(entityId: EntityID): void {
        if (!this.entities.has(entityId)) {
            return;
        }
        for (const componentMap of this.components.values()) {
            componentMap.delete(entityId);
        }
        this.entities.delete(entityId);
    }

    public addComponent<T extends Component>(entityId: EntityID, component: T): void {
        const componentClass = component.constructor as ComponentClass<T>;
        if (!this.components.has(componentClass)) {
            this.components.set(componentClass, new Map());
        }
        this.components.get(componentClass)!.set(entityId, component);
    }

    public getComponent<T extends Component>(entityId: EntityID, componentClass: ComponentClass<T>): T | undefined {
        const componentMap = this.components.get(componentClass);
        return componentMap?.get(entityId) as T | undefined;
    }

    public hasComponent<T extends Component>(entityId: EntityID, componentClass: ComponentClass<T>): boolean {
        return this.components.get(componentClass)?.has(entityId) || false;
    }

    public removeComponent<T extends Component>(entityId: EntityID, componentClass: ComponentClass<T>): void {
        this.components.get(componentClass)?.delete(entityId);
    }

    public getEntitiesWith<T extends Component>(componentClass: ComponentClass<T>): EntityID[] {
        const componentMap = this.components.get(componentClass);
        return componentMap ? Array.from(componentMap.keys()) : [];
    }

    public query(componentClasses: ComponentClass<any>[]): EntityID[] {
        if (componentClasses.length === 0) {
            return [];
        }

        const [firstClass, ...restClasses] = componentClasses;
        const initialEntities = this.getEntitiesWith(firstClass);

        return initialEntities.filter(entityId => 
            restClasses.every(componentClass => this.hasComponent(entityId, componentClass))
        );
    }

    public *view<T extends Component[]>(...componentClasses: { [K in keyof T]: ComponentClass<T[K]> }): Generator<{ entity: EntityID, components: T }> {
        const [firstComponentClass, ...restComponentClasses] = componentClasses;
        const firstComponentMap = this.components.get(firstComponentClass);

        if (!firstComponentMap) {
            return;
        }

        for (const entityId of firstComponentMap.keys()) {
            let hasAllComponents = true;
            for (const componentClass of restComponentClasses) {
                if (!this.hasComponent(entityId, componentClass)) {
                    hasAllComponents = false;
                    break;
                }
            }

            if (hasAllComponents) {
                const components = componentClasses.map(componentClass => this.getComponent(entityId, componentClass)) as T;
                yield { entity: entityId, components };
            }
        }
    }
}
