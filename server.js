import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = 3000;

// serve frontend
app.use(express.static("public"));

// simple cache
const cache = new Map();

// fetch helper
async function cachedFetch(url) {
  if (cache.has(url)) return cache.get(url);

  const res = await fetch(url);
  const data = await res.json();

  cache.set(url, data);
  return data;
}

app.get("/api/plugins", async (req, res) => {
  try {
    const query = req.query.q || "";
    const version = req.query.version || "";
    const page = parseInt(req.query.page) || 1;

    const limit = 20;
    const offset = (page - 1) * limit;

    if (!query.trim()) {
      return res.json({ hits: [], total: 0 });
    }

    let facets = [["categories:paper"]];
    if (version) {
      facets.push([`versions:${version}`]);
    }

    const url = `https://api.modrinth.com/v2/search?query=${encodeURIComponent(query)}&facets=${encodeURIComponent(JSON.stringify(facets))}&limit=${limit}&offset=${offset}`;

    const data = await cachedFetch(url);

    res.json({
      hits: data.hits,
      total: data.total_hits
    });

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch plugins" });
  }
});

// get versions (download links)
app.get("/api/plugin/:id", async (req, res) => {
  try {
    const url = `https://api.modrinth.com/v2/project/${req.params.id}/version`;
    const data = await cachedFetch(url);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch plugin versions" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});