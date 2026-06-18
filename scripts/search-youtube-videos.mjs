const queries = process.argv.slice(2);

function cleanText(value) {
  return value
    .replaceAll("\\u0026", "&")
    .replaceAll('\\"', '"')
    .replaceAll("\\/", "/");
}

function parseSearch(html) {
  const results = [];
  const regex =
    /"videoRenderer":\{"videoId":"([^"]+)".*?"title":\{"runs":\[\{"text":"([^"]+)"\}\]\}.*?"ownerText":\{"runs":\[\{"text":"([^"]+)".*?"viewCountText":\{"simpleText":"([^"]+ views)"\}/gs;
  let match;

  while ((match = regex.exec(html)) && results.length < 40) {
    results.push({
      videoId: match[1],
      title: cleanText(match[2]),
      channel: cleanText(match[3]),
      views: cleanText(match[4]),
      url: `https://www.youtube.com/watch?v=${match[1]}`
    });
  }

  return results;
}

for (const query of queries) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      "accept-language": "en-US,en;q=0.9",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36"
    }
  });
  const html = await response.text();
  const results = parseSearch(html);

  console.log(`\nQUERY: ${query}`);
  for (const result of results.slice(0, 20)) {
    console.log(`${result.views} | ${result.channel} | ${result.title} | ${result.url}`);
  }
}
