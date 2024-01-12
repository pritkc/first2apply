import { CORS_HEADERS } from "../_shared/cors.ts";
import { parseJobPage } from "../_shared/jobParser.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const { linkId, html } = await req.json();

    const url = ""; // todo: get url from db
    const jobsList = await parseJobPage({ url, html });

    return new Response(JSON.stringify({}), {
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
