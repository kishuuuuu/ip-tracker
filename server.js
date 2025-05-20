const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// Local known model codes
const deviceMap = {
  CPH2001: "OPPO A52",
  "SM-G991B": "Samsung Galaxy S21",
  M2007J20CG: "Xiaomi Mi 10T Lite",
  RMX3085: "Realme Narzo 30",
  IN2023: "OnePlus 8 Pro",
  CPH2339: "OPPO A57",
};

// Function to scrape GSMArena
async function fetchDeviceName(modelCode) {
  try {
    const url = `https://www.gsmarena.com/res.php3?sSearch=${modelCode}`;
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const name = $("div.makers a").first().text().trim();
    return name || `Unknown (${modelCode})`;
  } catch {
    return `Unknown (${modelCode})`;
  }
}

// Extract model code from user-agent
function extractModelCode(ua) {
  const match = ua.match(/;\s*([A-Z0-9\-]+)\s*(?:Build)?\//i);
  return match ? match[1].toUpperCase() : null;
}

app.post("/getInfo", async (req, res) => {
  const { ip, base64, time } = req.body;
  let decoded = "";
  let deviceModel = "-";

  // Decode Base64
  try {
    decoded = Buffer.from(base64, "base64").toString("utf-8");
  } catch {
    decoded = "Invalid Base64";
  }

  // Extract device info from decoded User-Agent
  const modelCode = extractModelCode(decoded);
  if (modelCode) {
    if (deviceMap[modelCode]) {
      deviceModel = deviceMap[modelCode];
    } else {
      deviceModel = await fetchDeviceName(modelCode);
    }
  }

  // IP Geo Lookup
  let city = "-";
  let region = "-";
  let country = "-";

  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}`);
    const data = response.data;
    if (data.status === "success") {
      city = data.city || "-";
      region = data.regionName || "-";
      country = data.countryCode || "-";
    }
  } catch (err) {
    console.error("Geo lookup failed:", err.message);
  }

  res.json({
    ip,
    decoded,
    deviceModel,
    city,
    region,
    country,
    time,
  });
});

app.listen(3000, () => {
  console.log("✅ Server running at http://localhost:3000");
});
