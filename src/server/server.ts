import { existsSync, promises, readdirSync } from 'fs';
import * as http from 'http';
import { extname, join } from 'path';

const PORT = 3000;
const basePath = process.env.OUT_PATH === 'output' ? './output' :  '.'; // Adjust paths accordingly

// Implement and configure basic http server using our index.ts with all data already available at the top
export function getServer() {
    return http.createServer(async (req, res) => {
        try {
            // Get the request's URL
            const requestUrl = req.url === '/' ? '/index.html' : req.url;
            if (!requestUrl) {
                console.error('Url is null');
                return;
            }

            // Check file path with existing files, otherwise redirect them to `index.html`: This makes it simple to start using that HTML
            if (!requestUrl.startsWith('/')) {
                // For every request use `/index.html` as a root: That is where your main page is.
                const filePath = join(basePath, 'index.html');
                const fileData = await promises.readFile(filePath);
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(fileData);
            }

            // This allows relative paths in CSS and Javascript using those files relative paths when they request those dynamically or using our new HTML to set those up. So our previously described paths like `game-d20/` can then be easily used. This is set using that path for now. It will use whatever paths the user hardcoded (or will use dynamically if implementing those) when using that html, to access assets, etc.. If creating subfolders to help organizing this logic and using placeholders as previously designed, implement their relative paths here.
            const filePath = join(basePath, requestUrl);
            const fileExtension = extname(filePath);
            const isDir = existsSync(filePath) && promises.lstat(filePath).then(res => res.isDirectory()).catch(() => false)
            if (await isDir) {
                // If it's a directory create the JSON for files and subdirectories:
                const files = await readdirSync(filePath, { withFileTypes: true })
                const responseData = files.map(file => {
                    return {
                        name: file.name,
                        type: file.isDirectory() ? 'directory' : 'file'
                    };
                });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(responseData))
                return
            }

            const fileData = await promises.readFile(filePath);
            res.writeHead(200, { 'Content-Type': getMIMEType(fileExtension) });
            res.end(fileData);
            return
        } catch (e) {
            console.error(e);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
        }
    });
}

function getMIMEType(fileExtension: string): string {
    switch (fileExtension) {
        case '.css':
            return 'text/css'
        case '.js':
            return 'text/javascript'
        case '.mjs':
            return 'text/javascript'
        case '.html':
            return 'text/html'
        case '.ico':
            return 'image/x-icon'
        default:
            return 'application/octet-stream';
    }
}

getServer().listen(PORT, () => {
    console.log(`Server listening on port ${PORT}. ${process.env.OUT_PATH} : ${basePath}`,);
});