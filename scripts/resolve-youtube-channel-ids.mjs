const handles = process.argv.slice(2);

for (const handle of handles) {
  const url = `https://www.youtube.com/${handle}`;
  const html = await fetch(url, {
    headers: {
      "accept-language": "en-US,en;q=0.9",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36"
    }
  }).then((response) => response.text());

  const canonical = html.match(
    /<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/([^"]+)"/
  );
  const json = html.match(/"channelId":"([^"]+)"/);
  console.log(`${handle} ${canonical?.[1] ?? json?.[1] ?? "not-found"}`);
}
