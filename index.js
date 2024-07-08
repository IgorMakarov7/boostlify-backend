require("dotenv").config();

const { Telegraf } = require("telegraf");
const axios = require("axios");
const express = require("express");
const crypto = require("crypto");

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();
app.use(express.json());

app.use(express.static("public"));

const cors = require("cors");
var corsOptions = {
  origin: "https://boostlify.netlify.app",
  optionsSuccessStatus: 200,
  methods: "GET, POST",
};
app.use(cors(corsOptions));

app.post("/api/telegram/validate", (request, response) => {
  const initData = new URLSearchParams(request.body.initData);
  initData.sort();
  const hash = initData.get("hash");
  initData.delete("hash");

  const dataToCheck = [...initData.entries()]
    .map(([key, value]) => key + "=" + value)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update("6498389353:AAErk3KqUxzPJPxwUBrv73b6MoDwbK0CEtQ")
    .digest();

  const _hash = crypto
    .createHmac("sha256", secretKey)
    .update(dataToCheck)
    .digest("hex");

  if (hash === _hash) {
    response.status(200).send("valid");
  } else {
    response.status(401).send("invalid");
  }
});

app.post("/api/telegram/userPhoto", async (request, response) => {
  const userId = request.body.id;
  const photos = await bot.telegram.getUserProfilePhotos(userId, 0, 1);
  const fileId = photos.photos[0][0].file_id;
  const file = await bot.telegram.getFile(fileId);
  const photoUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;

  const responseTelegram = await axios.get(photoUrl, {
    responseType: "arraybuffer",
  });
  const base64String = Buffer.from(responseTelegram.data, "binary").toString(
    "base64"
  );
  response.status(200).send(`data:image/jpeg;base64,${base64String}`);
});

app.listen(3030);
