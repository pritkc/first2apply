import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import { CORS_HEADERS } from "../_shared/cors.ts";

import { DbSchema } from "../_shared/types.ts";
import { getExceptionMessage, throwError } from "../_shared/errorUtils.ts";
import { parseJobDescription } from "../_shared/jobDescriptionParser.ts";
import { applyAdvancedMatchingFilters } from "../_shared/advancedMatching.ts";
import { Job } from "../_shared/types.ts";
import { createLoggerWithMeta } from "../_shared/logger.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const logger = createLoggerWithMeta({
    function: "scan-job-description",
  });
  try {
    const requestId = crypto.randomUUID();
    logger.addMeta("request_id", requestId);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }
    
    // Create two separate clients - one for service operations, one for user operations
    const serviceClient = createClient<DbSchema>(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    const userClient = createClient<DbSchema>(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: getUserError } =
      await userClient.auth.getUser();
    if (getUserError) {
      throw new Error(getUserError.message);
    }
    const user = userData?.user;
    logger.addMeta("user_id", user?.id ?? "");
    logger.addMeta("user_email", user?.email ?? "");

    const body: {
      jobId: number;
      html: string;
      maxRetries?: number;
      retryCount?: number;
      // Optional overrides from desktop app UI
      llmProvider?: "openai" | "gemini" | "llama";
      openAiApiKey?: string;
      geminiApiKey?: string;
    } = await req.json();
    const { jobId, html, maxRetries, retryCount } = body;
    logger.info(`processing job description for ${jobId}  ...`);

    // find the job and its site using service client for database operations
    const { data: job, error: findJobErr } = await serviceClient
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

    const { data: site, error: findSiteErr } = await serviceClient
      .from("sites")
      .select("*")
      .eq("id", job.siteId)
      .single();
    if (findSiteErr) {
      throw findSiteErr;
    }

    let updatedJob: Job = { ...job, status: "new" };
    if (!job.description) {
      // parse the job description
      logger.info(
        `[${site.provider}] parsing job description for ${jobId} ...`
      );
      
      // Debug: Log HTML length and check for applicant-related content
      logger.info(`[${site.provider}] HTML length: ${html.length} characters`);
      const hasApplicantContent = html.toLowerCase().includes('applicant');
      logger.info(`[${site.provider}] HTML contains 'applicant': ${hasApplicantContent}`);

      // update the job with the description
      const jd = parseJobDescription({ site, job, html });
      const isLastRetry = retryCount === maxRetries;
      
      updatedJob = {
        ...updatedJob,
        description: jd.content ?? updatedJob.description,
      };
      if (!jd.content && isLastRetry) {
        logger.error(
          `[${site.provider}] no JD details extracted from the html of job ${jobId}, this could be a problem with the parser`,
          {
            url: job.externalUrl,
            site: site.provider,
          }
        );

        await serviceClient
          .from("html_dumps")
          .insert([{ url: job.externalUrl, html }]);
      }

      if (jd.content) {
        logger.info(
          `[${site.provider}] finished parsing job description for ${job.title}`,
          {
            site: site.provider,
          }
        );
      }

      const llmProvider = (body.llmProvider ?? Deno.env.get("DEFAULT_LLM_PROVIDER") ?? "gemini") as
        | "openai"
        | "gemini"
        | "llama";
      const openAiApiKey = body.openAiApiKey ?? Deno.env.get("OPENAI_API_KEY");
      const geminiApiKey = body.geminiApiKey ?? Deno.env.get("GEMINI_API_KEY");

      logger.info(
        `LLM config resolved: provider=${llmProvider}, hasOpenAIKey=${!!openAiApiKey}, hasGeminiKey=${!!geminiApiKey}`
      );

      // Validate API keys based on provider
      if (llmProvider === "openai" && !openAiApiKey) {
        throw new Error("OPENAI_API_KEY is required when using OpenAI provider");
      }
      if (llmProvider === "gemini" && !geminiApiKey) {
        throw new Error("GEMINI_API_KEY is required when using Gemini provider");
      }

      const { newStatus, excludeReason } = await applyAdvancedMatchingFilters({
        logger,
        job: updatedJob,
        supabaseClient: serviceClient,
        openAiApiKey,
        geminiApiKey,
        llmProvider,
      });

      updatedJob = {
        ...updatedJob,
        status: newStatus,
        exclude_reason: excludeReason,
      };
    }

    logger.info(`[${site.provider}] ${updatedJob.status} ${job.title}`);

    const { error: updateJobErr } = await serviceClient
      .from("jobs")
      .update({
        description: updatedJob.description,
        status: updatedJob.status,
        updated_at: new Date(),
        exclude_reason: updatedJob.exclude_reason,
      })
      .eq("id", jobId)

      // I think this is causing jobs to be put back on new from deleted
      // if the app fails to process an entire batch in one cron interval
      // then the same job will be processed twice (since it's status is processing still)
      .eq("status", "processing");
    if (updateJobErr) {
      throw updateJobErr;
    }

    const parseFailed = !updatedJob.description;

    return new Response(JSON.stringify({ job: updatedJob, parseFailed }), {
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
        // status: 500,
      }
    );
  }
});
