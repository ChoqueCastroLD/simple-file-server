import sharp from "sharp";
import { join } from "path";
import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { readdir } from "fs/promises";
import { CONFIG } from "./utils/config";


const app = new Elysia()
    .use(cors())
    .onError(({ code, error }) => {
        console.log(code, error);
        return {
            code,
            error: error.message,
        }
    })
	.onResponse(({ request, path, set }) => {
        console.log(`[${request.method}] ${path} ${set.status}`);
	})
    .get('/uploads/*', ({ path }) => {
        const filePath = path.split('/').slice(2).join('/');
        return Bun.file(join(CONFIG.UPLOADS_FOLDER, filePath));
    })
    .get('/list', async () => {
        const files = await readdir(CONFIG.UPLOADS_FOLDER);
        return files;
    })
    .get('/list/previews', async () => {
        const files = await readdir(CONFIG.PREVIEWS_FOLDER);
        return files;
    })
    .get('/download/:filename/preview', async ({ params: { filename }, set }) => {
        const previewFilePath = join(CONFIG.PREVIEWS_FOLDER, filename);
        const file = await Bun.file(previewFilePath);
        if (await file.exists()) {
            return file;
        }
        try {
            const originalFilePath = join(CONFIG.UPLOADS_FOLDER, filename);
            const originalFile = await Bun.file(originalFilePath);
            if (!await originalFile.exists()) {
                throw new Error('File not found');
            }
            const originalFileBuffer = await originalFile.arrayBuffer();
            await sharp(originalFileBuffer)
                .jpeg({ quality: 1 })
                .toFile(previewFilePath);
            set.status = 201;
            throw new Error('Preview created');
        } catch (error: any) {
            console.error(error);
            return { error: error.message };
        }
    })
    .get('/download/:filename', ({ params: { filename } }) => {
        return Bun.file(join(CONFIG.UPLOADS_FOLDER, filename));
    })
    .post('/upload', async ({ body: { file } }) => {
        const filePath = join(CONFIG.UPLOADS_FOLDER, file.name);
        const fileExists = await Bun.file(filePath).exists();
        if (fileExists) {
            throw new Error('File already exists');
        }
        await Bun.write(filePath, file);
        return { filename: file.name };
    }, {
        body: t.Object({
            file: t.File({
                maxSize: '10m', // 10mb
                minSize: '1k', // 1kb
            })
        }),
        response: t.Object({
            filename: t.String()
        })
    })
    .listen(CONFIG.PORT);

console.log(`Server running on port ${app?.server?.port}`);
