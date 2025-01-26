import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import { CORS_HEADERS } from "../_shared/cors.ts";
import { DbSchema, Job } from "../_shared/types.ts";
import { getExceptionMessage } from "../_shared/errorUtils.ts";
import { cleanJobUrl } from "../_shared/jobListParser.ts";
import { createLoggerWithMeta } from "../_shared/logger.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const logger = createLoggerWithMeta({
    function: "create-link",
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

    const { data: userData, error: getUserError } =
      await supabaseClient.auth.getUser();
    if (getUserError) {
      throw new Error(getUserError.message);
    }
    const user = userData?.user;
    logger.addMeta("user_id", user?.id ?? "");
    logger.addMeta("user_email", user?.email ?? "");

    const { title, url } = await req.json();
    logger.info(`Creating link: ${title} - ${url}`);

    // list all job sites from db
    const { data, error: selectError } = await supabaseClient
      .from("sites")
      .select("*");
    if (selectError) throw new Error(selectError.message);
    const allJobSites = data ?? [];

    // insert a new link in the db
    const { cleanUrl, site } = cleanJobUrl({ url, allJobSites });
    // check if the site is deprecated
    if (site.deprecated) {
      throw new Error(
        `Site ${site.name} is deprecated and no longer supported. Please contact our support team if you need help.`
      );
    }
    const { data: createdLinks, error } = await supabaseClient
      .from("links")
      .insert({
        url: cleanUrl,
        title,
        site_id: site.id,
      })
      .select("*");
    if (error) throw error;

    const [link] = createdLinks ?? [];

    // legacy, we don't parse the jobs list when creating a new link anymore
    // but need to still return an empty array for compatibility
    const newJobs: Job[] = [];

    logger.info(`successfully created link: ${link.id}`);

    return new Response(JSON.stringify({ link, newJobs }), {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (error) {
    logger.error(getExceptionMessage(error));
    return new Response(
      JSON.stringify({ errorMessage: getExceptionMessage(error, true) }),
      {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        // until this is fixed: https://github.com/supabase/functions-js/issues/45
        // we have to return 200 and handle the error on the client side
        // status: 400,
      }
    );
  }
});
