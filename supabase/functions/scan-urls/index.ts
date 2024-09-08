import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { CORS_HEADERS } from "../_shared/cors.ts";
import { parseJobsListUrl } from "../_shared/jobListParser.ts";
import { DbSchema } from "../_shared/types.ts";
import { getExceptionMessage } from "../_shared/errorUtils.ts";
import { checkUserSubscription } from "../_shared/subscription.ts";

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
    const htmls: Array<{
      linkId: number;
      content: string;
      maxRetries?: number;
      retryCount?: number;
    }> = body.htmls;
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

    const userId = links?.[0]?.user_id;
    const { subscriptionHasExpired } = await checkUserSubscription({
      supabaseClient,
      userId,
    });
    if (subscriptionHasExpired) {
      console.log(`subscription has expired for user ${userId}`);
      return new Response(JSON.stringify({ newJobs: [], parseFailed: false }), {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    // list all job sites from db
    const { data, error: selectError } = await supabaseClient
      .from("sites")
      .select("*");
    if (selectError) throw new Error(selectError.message);
    const allJobSites = data ?? [];

    // parse htmls and match them with links
    let parseFailed = false;
    const isLastRetry = htmls.every(
      (html) => html.retryCount === html.maxRetries
    );
    const parsedJobs = await Promise.all(
      htmls.map(async (html) => {
        const link = links?.find((link) => link.id === html.linkId);
        // ignore links that are not in the db
        if (!link) {
          console.error(`link not found: ${html.linkId}`);
          return [];
        }
        const {
          jobs,
          site,
          parseFailed: currentUrlParseFailed,
        } = await parseJobsListUrl({
          allJobSites,
          url: link.url,
          html: html.content,
          isLastRetry,
        });

        console.log(`[${site.provider}] found ${jobs.length} jobs`);

        // if the parsing failed, save the html dump for debugging
        parseFailed = currentUrlParseFailed;
        if (currentUrlParseFailed && isLastRetry) {
          await supabaseClient
            .from("html_dumps")
            .insert([{ url: link.url, html: html.content }]);
        }

        return jobs;
      })
    ).then((r) => r.flat());

    const { data: upsertedJobs, error: insertError } = await supabaseClient
      .from("jobs")
      .upsert(
        parsedJobs.map((job) => ({ ...job, status: "processing" as const })),
        { onConflict: "user_id, externalId", ignoreDuplicates: true }
      )
      .select("*");
    if (insertError) throw new Error(insertError.message);

    const newJobs =
      upsertedJobs?.filter((job) => job.status === "processing") ?? [];
    console.log(`found ${newJobs.length} new jobs`);

    return new Response(JSON.stringify({ newJobs, parseFailed }), {
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
