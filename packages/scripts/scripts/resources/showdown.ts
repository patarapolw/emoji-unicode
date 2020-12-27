import axios from "axios";
import cheerio from "cheerio";
import fs from "fs";
import showdown from "showdown";

(async () => {
  const mdConverter = new showdown.Converter({
    emoji: true,
  });

  const r = await axios.get(
    "https://github.com/showdownjs/showdown/wiki/Emojis"
  );
  console.log("Emoji from showdownjs loaded");

  const out: {
    ascii: string;
    symbol: string;
    description: string;
  }[] = [];

  const $ = cheerio.load(r.data);
  for (const tr of Array.from($("tr", $("table tbody")[0]))) {
    const $td = $("td", tr);
    const text = $($td[1]).text();
    const c = $(mdConverter.makeHtml(text)).text();
    if (/[\x20-\x7F]/.test(c)) {
      continue;
    }

    const status = $($td[2]).text().trim();
    const codePoint =
      "0x" +
      [...c]
        .map((c0) => c0.codePointAt(0)!)
        .filter((c0) => c0)
        .map((c0) => c0.toString(16))
        .join("");

    if (status === "true") {
      out.push({
        ascii: codePoint,
        symbol: c,
        description: text,
      });
    }
  }

  fs.writeFileSync("raw/showdown.json", JSON.stringify(out, null, 2));
})().catch(console.error);
