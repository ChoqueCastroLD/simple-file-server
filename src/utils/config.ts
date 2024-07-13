import { join } from "path";

export const CONFIG = {
    PORT: Bun.env.PORT ? parseInt(Bun.env.PORT) : 3005,
    UPLOADS_FOLDER: join(process.cwd(), Bun.env.UPLOADS_FOLDER || "/uploads"),
    PREVIEWS_FOLDER: join(process.cwd(), Bun.env.PREVIEWS_FOLDER || "/previews"),
}