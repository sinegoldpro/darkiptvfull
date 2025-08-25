import fetch from "node-fetch";

export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    res.status(404).send("Not Found");
    return;
  }

  let url;
  try {
    // önce decodeURIComponent
    let decoded = decodeURIComponent(token);

    // eksik padding düzelt
    while (decoded.length % 4 !== 0) {
      decoded += "=";
    }

    url = Buffer.from(decoded, "base64").toString("utf-8");
  } catch (e) {
    console.error("Token decode error:", e);
    res.status(400).send("Invalid token");
    return;
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      res.status(response.status).send("Error fetching content");
      return;
    }

    res.setHeader(
      "Content-Type",
      response.headers.get("content-type") || "video/mp2t"
    );

    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
  } catch (err) {
    console.error("Segment fetch error:", err);
    res.status(500).send("Server error");
  }
}
