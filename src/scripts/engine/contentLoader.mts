// Interface for a generic content item (leaf node in the structure).
interface IContentItem {
    [get: string]: () => Promise<any>;
}

// Interface for a content category (a folder in the structure).
interface IContentCategory {
    [key: string]: IContentItem | IContentCategory;
}

export class ContentCategory implements IContentCategory {
    [key: string]: IContentCategory | IContentItem;
}

export class ContentItem implements IContentItem {
    [get: string]: () => Promise<any>;
}

export class ContentLoader {
    private contentData: IContentCategory = {};
    private campaignData: IContentCategory = {};

    public async getContent(): Promise<IContentCategory> {
        if (Object.keys(this.contentData).length > 0) {
            return this.contentData;
        }
        try {
            this.contentData = await this.loadDirectory('./content')
            console.log("content loaded successfully from javascript calls:", this.contentData)
        }
        catch (e) {
            console.error("Could not fetch data: ", e);
        }
        return this.contentData;
    }

    public async getCampaigns(): Promise<IContentCategory> {
        if (Object.keys(this.campaignData).length > 0) {
            return this.campaignData;
        }
        try {
            this.campaignData = await this.loadDirectory('./campaigns')
            console.log("campaigns loaded successfully from javascript calls:", this.campaignData)
        }
        catch (e) {
            console.error("Could not fetch data: ", e);
        }
        return this.campaignData;
    }

    private async loadDirectory(dirPath: string): Promise<IContentCategory> {
        const directory: IContentCategory = {};
        try {
            const response = await fetch(dirPath)
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            const responseData: any[] = await response.json()
            for (const file of responseData) {
                const fullPath = `${dirPath}/${file.name}`
                if (file.type === 'directory') {
                    directory[file.name] = await this.loadDirectory(fullPath)
                } else {
                    if (file.name.endsWith('.json')) {
                        const itemName = file.name.slice(0, -5)
                        directory[itemName] = this.createContentItem(fullPath);
                    }
                }
            }

        } catch (error) {
            console.error(`Error reading directory: ${dirPath}`, error);
        }
        return directory
    }

    private createContentItem(filePath: string): IContentItem {
        // Using a closure to encapsulate data and isLoaded, also changed it to 'let' instead of 'var'.
        const getLazyLoadFn = () => {
            let data: any = null;
            let isLoaded: boolean = false;

            return async () => {
                if (!isLoaded) {
                    try {
                        console.log(`Fetching ${filePath}`);
                        const response = await fetch(filePath)
                        if (!response.ok) {
                            throw new Error(`HTTP error: ${response.status}`);
                        }
                        data = await response.json()
                        isLoaded = true;
                    }
                    catch (error) {
                        console.error(`Error loading or parsing file: ${filePath}`, error);
                        return null
                    }
                }
                return data
            }
        };
        return {
            get: getLazyLoadFn()
        };
    }
}

export async function getIValue(item: IContentItem | IContentCategory | (() => Promise<any>)) {
    if ((item as ContentItem).get) {
        return await (item as ContentItem).get();
    }
    return null
}