import fetch from "node-fetch";

export default async function handler(req, res) {
  const { id } = req.query;

  const backupStream = "https://github.com/fluxmaxturkiye/yayinyok/raw/refs/heads/main/yayinkapali.m3u8";

  if (!id) {
    return res.redirect(backupStream);
  }

  const url = `http://p1.eu58.xyz:8080/play/live.php?mac=00:1A:79:07:C3:6C&stream=${id}&extension=m3u8`;

  let response;
  try {
    response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 13; Pixel 7 Pro) AppleWebKit/537.36 Chrome/124.0.6367.93 Mobile Safari/537.36",
      },
    });
  } catch (err) {
    return res.redirect(backupStream);
  }

  if (!response.ok) {
    return res.redirect(backupStream);
  }

  let text = await response.text();

  if (!text.includes("#EXTM3U")) {
    return res.redirect(backupStream);
  }

  // Base URL (segment yönlendirmesi için)
  const segmentBaseUrl = `${req.protocol || "https"}://${req.headers.host}/api/segment?token=`;

  let newLines = text.split("\n").map((line) => {
    if (line.startsWith("#") || line.trim() === "") return line;
    const encoded = Buffer.from(line).toString("base64");
    return `${segmentBaseUrl}${encodeURIComponent(encoded)}`;
  });

  res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
  res.send(newLines.join("\n"));
}
