const { onRequest } = require("firebase-functions/v2/https"); // 👈 Use v2
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/getInfo", async (req, res) => {
  const { ip, base64, time } = req.body;

  let decoded = "Invalid Base64";
  if (base64) {
    try {
      decoded = Buffer.from(base64, "base64").toString("utf-8");
    } catch (_) {}
  }

  let city = "-",
    region = "-",
    country = "-";
  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}`);
    const data = response.data;
    if (data.status === "success") {
      city = data.city || "-";
      region = data.regionName || "-";
      country = data.countryCode || "-";
    }
  } catch (err) {
    console.error("IP lookup failed:", err.message);
  }

  res.json({ ip, decoded, city, region, country, time });
});

// 🔁 Gen 2 deployment
exports.api = onRequest(
  { cpu: 1, memory: "256MiB", region: "us-central1" },
  app
);
