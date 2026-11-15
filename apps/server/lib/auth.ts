import { supabase } from "./supabase";
import { ApiError } from "./errors";
import { prisma } from "./prisma";
import type { User } from "@/generated/prisma/client";

export const requireUser = async (req: Request): Promise<User> => {
  // parse the bearer token from the req
  const raw = req.headers.get("authorization");
  // if head is missing, throw unauthenticated
  if (!raw)
    throw new ApiError("UNAUTHENTICATED", "Auth key is undefined or missing");
  const parsed = raw.match(
    /^Bearer\s+([A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+)$/i,
  );
  if (!parsed)
    throw new ApiError("UNAUTHENTICATED", `Unable to parse JWT bearer token`);

  // pase to supabase auth to get the user
  const jwt = parsed[1];
  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser(jwt);

  if (!authUser || error)
    throw new ApiError("UNAUTHENTICATED", "Invalid or expired token");

  // parse info for creating user if necessary
  const rawName = authUser.user_metadata.display_name;
  const displayName =
    typeof rawName === "string" ? rawName.trim().slice(0, 40) || null : null;

  if (!authUser.email)
    throw new ApiError(
      "UNAUTHENTICATED",
      "User doesn't have an email associated",
    );

  // create user row in our users table if missing
  let user = await prisma.user.findUnique({
    where: {
      id: authUser.id,
    },
  });

  if (!user)
    user = await prisma.user.upsert({
      where: { id: authUser.id },
      create: { id: authUser.id, email: authUser.email, displayName },
      update: {},
    });

  // return user row info
  return user;
};
