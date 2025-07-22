type Module = { [key: string]: (...args: any[]) => any };

export class ScriptingService {
    private moduleCache: Map<string, Module> = new Map();

    public async execute<T>(scriptPath: string, functionName: string, ...args: any[]): Promise<T | undefined> {
        let module = this.moduleCache.get(scriptPath);

        if (!module) {
            try {
                module = await import(scriptPath);
                this.moduleCache.set(scriptPath, module as Module);
            } catch (error) {
                console.error(`Failed to load script module: ${scriptPath}`, error);
                return undefined;
            }
        }

        const func = module?.[functionName];
        if (typeof func === 'function') {
            try {
                return await func(...args);
            } catch (error) {
                console.error(`Error executing function '${functionName}' in script: ${scriptPath}`, error);
                return undefined;
            }
        } else {
            console.warn(`Function '${functionName}' not found in script: ${scriptPath}`);
            return undefined;
        }
    }
}
