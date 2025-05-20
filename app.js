const readline = require("readline");
const axios = require("axios");
const cheerio = require("cheerio");

// Local known mappings (expand as you want)
const deviceMap = {
  CPH2001: "OPPO A52",
  "SM-G991B": "Samsung Galaxy S21",
  M2007J20CG: "Xiaomi Mi 10T Lite",
  RMX3085: "Realme Narzo 30",
  IN2023: "OnePlus 8 Pro",
  CPH2339: "OPPO A57",
};

// Function to scrape GSMArena for unknown models
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
function extractModel(ua) {
  const match = ua.match(/;\s*([A-Z0-9\-]+)\s*(?:Build)?\//i);
  return match ? match[1].toUpperCase() : null;
}

// Process all lines
async function processUserAgents(lines) {
  console.log("\n📱 Detected Phone Models:\n");
  for (let i = 0; i < lines.length; i++) {
    const ua = lines[i];
    const modelCode = extractModel(ua);
    if (!modelCode) {
      console.log(`${i + 1}. Unknown (no model found)`);
      continue;
    }

    if (deviceMap[modelCode]) {
      console.log(`${i + 1}. ${deviceMap[modelCode]}`);
    } else {
      const name = await fetchDeviceName(modelCode);
      console.log(`${i + 1}. ${name}`);
    }
  }
}

// Set up for multi-line paste
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("Paste ALL your User-Agent strings at once (multi-line input).");
console.log("Press ENTER twice when done:\n");

let input = "";

rl.on("line", (line) => {
  if (line.trim() === "") {
    rl.close();
  } else {
    input += line + "\n";
  }
});

rl.on("close", async () => {
  const userAgents = input
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  await processUserAgents(userAgents);
});
