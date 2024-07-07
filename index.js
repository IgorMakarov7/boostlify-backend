const express = require("express");
const crypto = require("crypto");
const https = require("https");

const app = express();
app.use(express.json());

app.use(express.static("public"));

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
    response.sendStatus(200);
  } else {
    response.sendStatus(401);
  }
});

app.post("/api/telegram/userPhoto", async (request, response) => {
  const file_id = await fetch(
    "https://api.telegram.org/bot6498389353:AAErk3KqUxzPJPxwUBrv73b6MoDwbK0CEtQ/getUserProfilePhotos",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: request.body.id, limit: "1" }),
    }
  )
    .then((response) => response.json())
    .then((response) => {
      return response.result.photos[0][0].file_id;
    });

  const file_path = await fetch(
    "https://api.telegram.org/bot6498389353:AAErk3KqUxzPJPxwUBrv73b6MoDwbK0CEtQ/getFile",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ file_id: file_id }),
    }
  )
    .then((response) => response.json())
    .then((response) => {
      return response.result.file_path;
    });

  https
    .get(
      `https://api.telegram.org/file/bot6498389353:AAErk3KqUxzPJPxwUBrv73b6MoDwbK0CEtQ/${file_path}`,
      (resp) => {
        let data = "";

        resp.on("data", (chunk) => {
          data += chunk;
        });

        resp.on("end", () => {
          response.status(200).send(data);
        });
      }
    )
    .on("error", (err) => {
      response.status(403);
    });
});

app.listen(3030);
