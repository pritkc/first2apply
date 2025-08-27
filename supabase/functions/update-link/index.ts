import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import { CORS_HEADERS } from "../_shared/cors.ts";
import { DbSchema } from "../_shared/types.ts";
import { getExceptionMessage } from "../_shared/errorUtils.ts";
import { cleanJobUrl } from "../_shared/jobListParser.ts";
import { createLoggerWithMeta } from "../_shared/logger.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const logger = createLoggerWithMeta({
    function: "update-link",
  });

  try {
    const requestId = crypto.randomUUID();
    logger.addMeta("request_id", requestId);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const supabaseClient = createClient<DbSchema>(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: getUserError } = await supabaseClient.auth.getUser();
    if (getUserError) {
      throw new Error(getUserError.message);
    }
    const user = userData?.user;
    logger.addMeta("user_id", user?.id ?? "");
    logger.addMeta("user_email", user?.email ?? "");

    const { linkId, title, url } = (await req.json()) as {
      linkId: number;
      title: string;
      url: string;
    };

    logger.info(`Updating link ${linkId}: ${title} - ${url}`);

    // fetch all job sites to identify and normalize the URL
    const { data: sites, error: selectSitesErr } = await supabaseClient.from("sites").select("*");
    if (selectSitesErr) throw new Error(selectSitesErr.message);
    const allJobSites = sites ?? [];

    // compute clean URL and site
    const { cleanUrl, site } = cleanJobUrl({ url, allJobSites });

    // block deprecated providers
    if (site.deprecated) {
      throw new Error(
        `Site ${site.name} is deprecated and no longer supported. Please contact our support team if you need help.`
      );
    }

    // Update row – also reset failure flags to allow fresh scans
    const { data: updated, error: updateErr } = await supabaseClient
      .from("links")
      .update({
        title: title?.trim?.() ?? title,
        url: cleanUrl,
        site_id: site.id,
        scrape_failure_count: 0,
        scrape_failure_email_sent: false,
      })
      .eq("id", linkId)
      .select("*")
      .single();

    if (updateErr) throw updateErr;

    return new Response(JSON.stringify(updated), {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (error) {
    logger.error(getExceptionMessage(error));
    return new Response(
      JSON.stringify({ errorMessage: getExceptionMessage(error, true) }),
      {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      }
    );
  }
});


