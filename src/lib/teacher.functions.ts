import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const PIN = "8954";
const patch = z.object({
  name: z.string().max(100).optional(),
  last: z.string().max(100).optional(),
  repo: z.string().regex(/^[\w.-]+\/[\w.-]+$/).optional(),
  percent: z.number().int().min(0).max(100).nullable().optional(),
  review: z.string().max(500).nullable().optional(),
  override_date: z.string().max(20).nullable().optional(),
  approved: z.boolean().optional(),
});

export const teacherUpdate = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ pin: z.string(), id: z.string().uuid(), patch }).parse(d))
  .handler(async ({ data }) => {
    if (data.pin !== PIN) throw new Error("PIN incorrecto");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("students").update(Object.fromEntries(Object.entries(data.patch).filter(([, v]) => v !== undefined)) as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const teacherDelete = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ pin: z.string(), id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    if (data.pin !== PIN) throw new Error("PIN incorrecto");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("students").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
