/**
 * Function used to download the HTML of a given URL.
 */
export async function downloadUrl(url: string) {
  console.log(`downloading url: ${url} ...`);
  const response = await fetch(url, {
    headers: {
      // set the user agent to be the same as the browser
      // this is needed to prevent some websites from blocking the request
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "*/*",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
    },
  });
  const html = await response.text();
  console.log(`finished downloading url: ${url}`);

  return html;
}
