import sharp from "sharp";
import { join } from "path";
import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { readdir } from "fs/promises";
import { CONFIG } from "./utils/config";


const app = new Elysia()
    .use(cors({
        origin: true,
        methods: "*",
        allowedHeaders: ["content-type"],
        exposeHeaders: "*",
        credentials: true,
        maxAge: 50000,
        preflight: true,
    }))
    .onError(({ code, error }) => {
        console.log(code, error);
        return {
            code,
            error: error.message,
        }
    })
    .onAfterResponse(({ request, path, set }) => {
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
                .blur(10)
                .jpeg({
                    quality: 1,
                    chromaSubsampling: '4:4:4',
                    trellisQuantisation: true,
                    overshootDeringing: true,
                    optimizeScans: true,
                    quantisationTable: 2,
                    force: true,
                    optimiseCoding: true,
                    mozjpeg: true,
                    optimiseScans: true,
                    optimizeCoding: true,
                    progressive: true,
                })
                .toFile(previewFilePath);
            set.status = 201;
            const newFile = await Bun.file(previewFilePath);
            if (await newFile.exists()) {
                return newFile;
            }
            throw new Error('Error creating preview');
        } catch (error: any) {
            console.error(error);
            return { error: error.message };
        }
    })
    .get('/download/:filename', ({ params: { filename } }) => {
        return Bun.file(join(CONFIG.UPLOADS_FOLDER, filename));
    })
    .post('/upload', async ({ body: { file }, query: { filename } }) => {
        const filePath = join(CONFIG.UPLOADS_FOLDER, filename || file.name);
        const fileExists = await Bun.file(filePath).exists();
        if (fileExists) {
            throw new Error('File already exists');
        }
        await Bun.write(filePath, file);
        return { filename: filename || file.name };
    }, {
        body: t.Object({
            file: t.File({
                maxSize: '100m', // 100mb
                minSize: '1k', // 1kb
            })
        }),
        query: t.Optional(t.Object({
            filename: t.String()
        })),
        response: t.Object({
            filename: t.String()
        })
    })
    .listen(CONFIG.PORT);

console.log(`Server running on port ${app?.server?.port}`);
