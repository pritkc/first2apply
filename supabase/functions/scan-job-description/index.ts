import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { CORS_HEADERS } from "../_shared/cors.ts";

import { DbSchema } from "../_shared/types.ts";
import { getExceptionMessage } from "../_shared/errorUtils.ts";
import { parseJobDescription } from "../_shared/jobDescriptionParser.ts";

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

    const body: { jobId: number; html: string } = await req.json();
    const { jobId, html } = body;

    // find the job and its site
    const { data: job, error: findJobErr } = await supabaseClient
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();
    if (findJobErr) {
      throw findJobErr;
    }
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }
    const { data: site, error: findSiteErr } = await supabaseClient
      .from("sites")
      .select("*")
      .eq("id", job.siteId)
      .single();
    if (findSiteErr) {
      throw findSiteErr;
    }

    // parse the job description
    console.log(
      `[${site.provider}] parsing job description for ${job.title} ...`
    );
    const jd = parseJobDescription({ site, job, html });

    // update the job with the description
    let updatedJob = job;
    const hasUpdates = Object.values(jd).some((v) => v !== undefined);
    if (hasUpdates) {
      const { error: updateJobErr } = await supabaseClient
        .from("jobs")
        .update({ description: jd.content })
        .eq("id", jobId);
      if (updateJobErr) {
        throw updateJobErr;
      }

      updatedJob = { ...job, description: jd.content };
    } else {
      console.log(
        "no JD details extracted from the html, this could be a problem with the parser"
      );
    }

    console.log(
      `[${site.provider}] finished parsing job description for ${job.title}`
    );

    return new Response(JSON.stringify({ job: updatedJob }), {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (error) {
    console.error(getExceptionMessage(error));
    return new Response(
      JSON.stringify({ errorMessage: getExceptionMessage(error, true) }),
      {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        // until this is fixed: https://github.com/supabase/functions-js/issues/45
        // we have to return 200 and handle the error on the client side
        // status: 500,
      }
    );
  }
});
