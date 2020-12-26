import axios from "axios";
import fs from "fs";

async function getToken(): Promise<{
  access_token: string;
}> {
  return axios
    .post(
      "https://www.reddit.com/api/v1/access_token",
      "grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
          ).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        params: {
          // scope: "read",
        },
      }
    )
    .then((r) => r.data);
}

if (require.main === module) {
  getToken().then((data) =>
    fs.writeFileSync("token.json", JSON.stringify(data))
  );
}
