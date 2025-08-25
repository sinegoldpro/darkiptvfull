import fetch from "node-fetch";

export default async function handler(req, res) {
  let { id } = req.query;

  // .m3u8 uzantısını temizle, URL /api/184203.m3u8 şeklinde olsa da çalışsın
  if (!id) {
    return res.redirect(
      "https://github.com/fluxmaxturkiye/yayinyok/raw/refs/heads/main/yayinkapali.m3u8"
    );
  }
  id = id.replace(".m3u8", "");

  const backupStream =
    "https://github.com/fluxmaxturkiye/yayinyok/raw/refs/heads/main/yayinkapali.m3u8";

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

  let text = await response.text();
  if (!text.includes("#EXTM3U")) {
    return res.redirect(backupStream);
  }

  // Base URL çıkar (segmentlerin tam linkini kurmak için)
  const finalUrl = new URL(response.url);
  const baseUrl = `${finalUrl.protocol}//${finalUrl.host}`;

  // Vercel segment yönlendirme (segment.js dosyası)
  const segmentBaseUrl = `https://${req.headers.host}/api/segment?token=`;

  // M3U8 içeriğini işle
  const newLines = text.split("\n").map((line) => {
    if (line.startsWith("#") || line.trim() === "") return line;

    // Eğer segment path "/" ile başlıyorsa → baseUrl ekle
    const fullUrl = line.startsWith("http")
      ? line
      : baseUrl + (line.startsWith("/") ? line : "/" + line);

    const encoded = Buffer.from(fullUrl).toString("base64");
    return `${segmentBaseUrl}${encodeURIComponent(encoded)}`;
  });

  res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
  res.send(newLines.join("\n"));
}
