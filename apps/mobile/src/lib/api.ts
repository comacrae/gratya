/**
 *  Aprivate function that:
 *  gets current session
 *  builds headers: Authorization if session; Content-Type JSON if body
 * fetches full URL with method, headers, and body turned into a json string
 */

import { supabase } from "@/lib/supabase";
import { ApiError, ErrorEnvelopeSchema } from "@gratya/shared";
import { z } from "zod";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;
if (!apiUrl) throw new Error("EXPO_PUBLIC_API_URL is undefined");

type HTTPMethod = "GET" | "PATCH" | "POST" | "DELETE";

async function send(
  method: HTTPMethod,
  path: string,
  body?: unknown,
): Promise<unknown> {
  // get current supabase auth session fresh for each request
  const {
    data: { session },
  } = await supabase.auth.getSession();

  //build headers
  const headers: Record<string, string> = {};
  if (session) headers["Authorization"] = `Bearer ${session.access_token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  // fetch full url
  const res = await fetch(`${apiUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 204) return undefined;

  //read body as JSON; if can't read, fall back to null
  const data: unknown = await res.json().catch(() => null);

  // if it failed, try to check why and throw an appropriate client side error
  if (!res.ok) {
    if (res.status === 401)
      // sign out first on unauthorized err
      await supabase.auth.signOut();

    const result = ErrorEnvelopeSchema.safeParse(data);
    if (!result.success)
      // if response is not parsable, construct an internal error
      throw new ApiError("INTERNAL", "Error occured");
    else
      throw new ApiError(
        result.data.error.code,
        result.data.error.message,
        result.data.error.details,
      );
  }

  return data;
}

const parseData = <T>(data: unknown, schema: z.ZodType<T>): T => {
  const result = schema.safeParse(data);
  if (!result.success)
    throw new ApiError(
      "INTERNAL",
      "Unexpected response from server",
      result.error.issues,
    );
  return result.data;
};

const get = async <T>(path: string, schema: z.ZodType<T>): Promise<T> => {
  const data = await send("GET", path);
  return parseData(data, schema);
};

const post = async <T>(
  path: string,
  schema: z.ZodType<T>,
  body?: unknown,
): Promise<T> => {
  const data = await send("POST", path, body);
  return parseData(data, schema);
};

const patch = async <T>(
  path: string,
  schema: z.ZodType<T>,
  body?: unknown,
): Promise<T> => {
  const data = await send("PATCH", path, body);
  return parseData(data, schema);
};

const del = async (path: string): Promise<void> => {
  await send("DELETE", path);
  return;
};

export const api = {
  get: get,
  post: post,
  patch: patch,
  delete: del,
};
