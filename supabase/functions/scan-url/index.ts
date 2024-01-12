import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { CORS_HEADERS } from "../_shared/cors.ts";
import { parseJobPage } from "../_shared/jobParser.ts";
import { DbSchema } from "../_shared/types.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }
    const supabaseClient = createClient<DbSchema>(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { linkId, html } = await req.json();

    // fetch link from db
    const { data, error } = await supabaseClient
      .from("links")
      .select("*")
      .eq("id", linkId);
    if (error) throw error;

    const [link] = data ?? [];
    const jobsList = await parseJobPage({ url: link.url, html });

    // diff the jobs list and save new jobs in the db
    const visibleJobs = jobsList.map((job) => ({
      ...job,
      visible: true,
      archived: false,
    }));
    const { data: insertedJobs, error: insertError } = await supabaseClient
      .from("jobs")
      .upsert(visibleJobs, { onConflict: "externalId" })
      .select("*");
    if (insertError) throw insertError;

    const newJobs = insertedJobs?.filter((job) => job.visible) ?? [];
    return new Response(JSON.stringify({ newJobs }), {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (error) {
    console.error(error);

    return new Response(JSON.stringify({ error_message: error.message }), {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      status: 500,
    });
  }
});
