import fetch from "node-fetch";

export default async function handler(req, res) {
  const { id } = req.query;
  const backupStream = "https://github.com/fluxmaxturkiye/yayinyok/raw/refs/heads/main/yayinkapali.m3u8";

  // Eğer id yoksa backup stream'e yönlendir
  if (!id) {
    return res.redirect(backupStream);
  }

  const url = `http://iptv.darktv.in:80/play/live.php?mac=00:1A:79:11:15:92&stream=${id}&extension=m3u8`;

  let response;
  try {
    response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 13; Pixel 7 Pro) AppleWebKit/537.36 Chrome/124.0.6367.93 Mobile Safari/537.36",
      },
    });
  } catch (err) {
    console.error("Fetch error:", err);
    return res.redirect(backupStream);
  }

  if (!response.ok) {
    return res.redirect(backupStream);
  }

  const text = await response.text();

  if (!text.includes("#EXTM3U")) {
    return res.redirect(backupStream);
  }

  // Base URL çıkar (segmentlerin tam linkini kurmak için)
  const finalUrl = new URL(response.url);
  const baseUrl = `https://primal.b-cdn.net/media-cache?&u=${finalUrl.protocol}//${finalUrl.host}`;

  // Vercel segment yönlendirme URL'si
  const segmentBaseUrl = `https://darkiptvcdn.d53kwrtmgs53a2.workers.dev/api/segment.js?token=`;

  const newLines = text.split("\n").map((line) => {
    if (line.startsWith("#") || line.trim() === "") return line;

    // Segment path'i tam URL'ye dönüştür
    const fullUrl = line.startsWith("http") ? line : baseUrl + (line.startsWith("/") ? line : "/" + line);
    const encoded = Buffer.from(fullUrl).toString("base64");

    return `${segmentBaseUrl}${encodeURIComponent(encoded)}`;
  });

  res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
  res.send(newLines.join("\n"));
}
