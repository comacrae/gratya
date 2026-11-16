import { z } from "zod";
import { UpdateMeSchema } from "./schemas";
export type UpdateMe = z.infer<typeof UpdateMeSchema>;
