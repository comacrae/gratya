/*inside each vitest worker, replace DATABASE_URL with the container's URL before anythign imports to prisma*/
import { inject } from "vitest";

process.env.DATABSE_URL = inject("databaseUrl");
