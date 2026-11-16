import {defineConfig} from "vitest/config";
import {loadEnv} from "vite";
import { fileURLToPath} from "node:url";

export default defineConfig((({mode}) => ({
    resolve: {alias: {"~": fileURLToPath(new URL("./", import.meta.url))}}, // to resolve @/lib/auth
    test: {env: loadEnv(mode, process.cwd(), ""), // to prevent ZodError on SUPABASE_URL when prisma.ts imported
        globalSetup: ["./tests/global-setup.ts"], // need a container with db to test against
        setupFiles: ["./container-env.ts", "./setup.ts"], // need to apply fake supabase, truncate test tables, and overwrite db url to test db
        fileParallelism:false // to prevent tests that truncate tables from messing with eachother
    }
})))