const handles = process.argv.slice(2);

function cleanText(value) {
  return value
    .replaceAll("\\u0026", "&")
    .replaceAll('\\"', '"')
    .replaceAll("\\/", "/");
}

function parseVideos(html) {
  const videos = [];
  const regex =
    /"lockupMetadataViewModel":\{"title":\{"content":"([^"]+)"\}.*?"metadataParts":\[\{"text":\{"content":"([^"]+ views)"\}/gs;
  let match;

  while ((match = regex.exec(html)) && videos.length < 20) {
    const title = cleanText(match[1]);
    const views = cleanText(match[2]);
    if (!videos.some((video) => video.title === title)) {
      videos.push({ title, views });
    }
  }

  return videos;
}

for (const handle of handles) {
  const url = `https://www.youtube.com/${handle}/videos`;
  const response = await fetch(url, {
    headers: {
      "accept-language": "en-US,en;q=0.9",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36"
    }
  });
  const html = await response.text();
  const videos = parseVideos(html);

  console.log(`\n${handle}`);
  console.log(url);
  for (const video of videos.slice(0, 12)) {
    console.log(`${video.views} | ${video.title}`);
  }
}
