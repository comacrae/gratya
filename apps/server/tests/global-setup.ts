/*Once per run start a postgres 17 container, apply prisma migrations, hand its URL to vitest workers, and stop container at end*/
import { PostgreSqlContainer } from "@testcontainers/postgresql"; // starts container
import { execSync } from "node:child_process"; // for running prisma CLI and waiting for it
import type { TestProject } from "vitest/node"; // type of arg vitest passes to setup.ts

export default async function setup(project: TestProject) {
  //start the container on the pinned image and await it
  const db = await new PostgreSqlContainer("postgres:17-alpine").start();

  //read the connection url
  const url = db.getConnectionUri();

  // run prisma migrate deploy with DIRECT_URL set to the test container uri
  // we have to spread the process env because pnpm needs to get picked up from PATH var
  execSync("pnpm exec prisma migrate deploy", {
    env: { ...process.env, DIRECT_URL: url },
    stdio: "inherit",
  });

  //provide the db url to the vitest workers
  project.provide("databaseUrl", url);

  return async () => {
    await db.stop();
  };
}

declare module "vitest" {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}
