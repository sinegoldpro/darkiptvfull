import fetch from "node-fetch";

export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    res.status(404).send("Not Found");
    return;
  }

  let url;
  try {
    url = Buffer.from(decodeURIComponent(token), "base64").toString("utf-8");
  } catch {
    res.status(400).send("Invalid token");
    return;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      res.status(response.status).send("Error fetching content");
      return;
    }

    res.setHeader("Content-Type", response.headers.get("content-type") || "video/mp2t");

    response.body.pipe(res);
  } catch (err) {
    res.status(500).send("Server error");
  }
}
