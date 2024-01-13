import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { CORS_HEADERS } from "../_shared/cors.ts";
import { parseJobPage } from "../_shared/jobParser.ts";
import { DbSchema, Job } from "../_shared/types.ts";
import { getExceptionMessage } from "../_shared/errorUtils.ts";

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

    const body = await req.json();
    const htmls: Array<{ linkId: string; content: string }> = body.htmls;
    if (htmls.length === 0) {
      return new Response(JSON.stringify({ newJobs: [] }), {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    // fetch links from db
    const linkIds = htmls.map((html) => html.linkId);
    const { data: links, error } = await supabaseClient
      .from("links")
      .select("*")
      .in("id", linkIds);
    if (error) throw new Error(error.message);

    // parse htmls and match them with links
    const parsedJobs = await Promise.all(
      htmls.map(async (html): Promise<Job[]> => {
        const link = links?.find((link) => link.id === html.linkId);
        // ignore links that are not in the db
        if (!link) {
          console.error(`link not found: ${html.linkId}`);
          return [];
        }
        const jobsList = await parseJobPage({
          url: link.url,
          html: html.content,
        });

        return jobsList;
      })
    ).then((r) => r.flat());

    // get existing jobs from db
    const externalIds = parsedJobs.map((job) => job.externalId);
    console.log(`checking for existing jobs: ${externalIds} ...`);
    const { data: existingJobsList, error: existingJobsError } =
      await supabaseClient
        .from("jobs")
        .select("*")
        .in("externalId", externalIds);

    if (existingJobsError) throw new Error(existingJobsError.message);
    console.log(`found ${existingJobsList?.length} existing jobs`);

    // diff the jobs list and save new jobs in the db
    const newJobsFound = parsedJobs.filter(
      (job) =>
        !existingJobsList?.find(
          (existingJob) => existingJob.externalId === job.externalId
        )
    );
    console.log(`found ${newJobsFound.length} new jobs`);
    const { data: newJobs, error: insertError } = await supabaseClient
      .from("jobs")
      .upsert(
        newJobsFound.map((job) => ({ ...job, visible: true })),
        { onConflict: "externalId", ignoreDuplicates: true }
      )
      .select("*");
    if (insertError) throw new Error(insertError.message);

    return new Response(JSON.stringify({ newJobs }), {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (error) {
    console.error(getExceptionMessage(error));
    return new Response(
      JSON.stringify({ errorMessage: getExceptionMessage(error, true) }),
      {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        status: 500,
      }
    );
  }
});
