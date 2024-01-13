/**
 * Function used to download the HTML of a given URL.
 */
export async function downloadUrl(url: string) {
  console.log(`downloading url: ${url} ...`);
  const response = await fetch(url);
  const html = await response.text();
  console.log(`finished downloading url: ${url}`);

  return html;
}
