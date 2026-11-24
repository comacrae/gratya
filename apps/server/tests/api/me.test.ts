import { describe, it, expect } from "vitest";
import { GET, PATCH } from "@/app/api/me/route";
import { prisma } from "@/lib/prisma"; // mocked in fake-supabase.ts
import { tokenFor } from "../helpers/fake-supabase";
import { MeSchema } from "@gratya/shared";

const URL_ME = "http://localhost/api/me";
const newUser = (displayName: string) => ({
  id: crypto.randomUUID(),
  displayName,
  email: `${crypto.randomUUID()}@test.dev`,
});

describe("GET /api/me", () => {
  it("401s without a token", async () => {
    const res = await GET(new Request(URL_ME), {});
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHENTICATED");
  });

  it("200s and creates User row on first call", async () => {
    const u = newUser("Colin");
    const jwt = tokenFor(u);
    const req = new Request(URL_ME, { headers: { authorization: jwt } });
    const res = await GET(req, {});
    // expect 200
    expect(res.status).toBe(200);
    //expect user row created
    expect(await prisma.user.count()).toBe(1);
  });

  it("sets displayName from token metadata on first call", async () => {
    //register a fake user whos display name has spaces around it
    const name = "  Colin   ";
    const u = newUser(name);
    const jwt = tokenFor(u);

    //call GET and parse JSON
    const req = new Request(URL_ME, { headers: { authorization: jwt } });
    const res = await GET(req, {});
    const body = await res.json();
    expect(body.displayName).toBe("Colin");

    // also check the prisma value

    const storedUser = await prisma.user.findUnique({ where: { id: u.id } });
    const storedDisplayName = storedUser ? storedUser.displayName : null;
    expect(storedDisplayName).toBe("Colin");
  });

  it("does not duplicate User on second call", async () => {
    const u = newUser("Colin");
    const jwt = tokenFor(u);
    const req1 = new Request(URL_ME, { headers: { authorization: jwt } });
    const req2 = new Request(URL_ME, { headers: { authorization: jwt } });

    // call both in parallel
    const [resA, resB] = await Promise.all([GET(req1, {}), GET(req2, {})]);
    const [a, b] = await Promise.all([resA.json(), resB.json()]);

    expect(await prisma.user.count()).toBe(1);
    expect(a.id).toEqual(b.id);
  });
});

describe("PATCH /api/me", () => {
  it("422s for an empty display name", async () => {
    const u = newUser("Colin");
    const jwt = tokenFor(u);
    const getReq = new Request(URL_ME, { headers: { authorization: jwt } });

    await GET(getReq, {}); // register a fake user

    const patchReq = new Request(URL_ME, {
      method: "PATCH",
      headers: { authorization: jwt, "content-type": "application/json" },
      body: JSON.stringify({ displayName: null }),
    });
    const res = await PATCH(patchReq, {});
    const body = await res.json();
    expect(res.status).toBe(422);
    expect(body.error.code).toBe("VALIDATION");
  });

  it("200s for a valid input", async () => {
    const u = newUser("Colin");
    const jwt = tokenFor(u);
    const getReq = new Request(URL_ME, { headers: { authorization: jwt } });

    await GET(getReq, {}); // register a fake user

    const patchReq = new Request(URL_ME, {
      method: "PATCH",
      headers: { authorization: jwt, "content-type": "application/json" },
      body: JSON.stringify({ displayName: "     new name    " }),
    });

    const res = await PATCH(patchReq, {});
    const body = await res.json();
    expect(res.status).toBe(200);
    const parseResult = MeSchema.safeParse(body);
    expect(parseResult.success).toBe(true);
    expect(parseResult.data?.displayName).toBe("new name");
  });
});
