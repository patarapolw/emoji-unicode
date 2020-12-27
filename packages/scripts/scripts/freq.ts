import fs from "fs";
import runes from "runes2";
import yaml from "js-yaml";

function clone<T>(o: T): T {
  return JSON.parse(JSON.stringify(o));
}

function sumValues(o: Record<string, number | undefined>): number {
  return Object.values(o)
    .map((v) => v || 0)
    .reduce((prev, v) => prev + v, 0);
}

async function main() {
  const unicode = new Map<
    string,
    {
      type?: "emoji";
    }
  >();

  for (const r of JSON.parse(fs.readFileSync("raw/htmlcodes.json", "utf-8"))) {
    unicode.set(r.symbol, {});
  }

  for (const r of JSON.parse(fs.readFileSync("raw/emojis.json", "utf-8"))
    .emojis) {
    unicode.set(r.emoji, { type: "emoji" });
  }

  for (const [k] of unicode) {
    if (/^[\x20-\x7f]$/.test(k)) {
      unicode.delete(k);
    }
  }

  const freqMap = new Map<
    string,
    {
      reddit?: number;
      showdown?: number;
      "emojis.json"?: number;
    }
  >();
  for (const c of runes(fs.readFileSync("raw/reddit.txt", "utf-8"))) {
    let prev = freqMap.get(c);

    if (unicode.has(c) || prev) {
      prev = prev || {
        reddit: 0,
      };
      prev.reddit = prev.reddit || 0;
      prev.reddit++;

      unicode.delete(c);
      freqMap.set(c, prev);
    }
  }

  Array.from(unicode.keys()).map((c) => freqMap.set(c, {}));
  const sumReddit = Array.from(freqMap.values()).reduce(
    (prev, c) => prev + (c.reddit || 0),
    0
  );

  for (const [k, v] of freqMap) {
    if (v.reddit) {
      v.reddit = (v.reddit / sumReddit) * 100;
      freqMap.set(k, v);
    }
  }

  for (const r of JSON.parse(fs.readFileSync("raw/emojis.json", "utf-8"))
    .emojis) {
    const v = freqMap.get(r.emoji);
    if (v) {
      v["emojis.json"] = 1;
      freqMap.set(r.emoji, v);
    }
  }

  for (const r of JSON.parse(fs.readFileSync("raw/showdown.json", "utf-8"))) {
    const v = freqMap.get(r.symbol);
    if (v) {
      v.showdown = 1;
      freqMap.set(r.symbol, v);
    }
  }

  const sortedData = Array.from(freqMap)
    .sort(([, a], [, b]) => sumValues(b) - sumValues(a))
    .map(([k, v]) => {
      return clone({
        ascii:
          "0x" +
          [...k]
            .map((c) => c.codePointAt(0))
            .filter((c) => c)
            .map((c) => c!.toString(16))
            .join(""),
        entry: k,
        rating: v,
      });
    });

  const out = yaml.safeDump(sortedData);

  fs.writeFileSync("../../data/frequency.yaml", out);
  fs.writeFileSync(
    "../../data/frequency.md",
    sortedData
      .map(({ entry, ascii, rating }) =>
        [
          `- ${entry} (${ascii})`,
          Object.entries(rating)
            .filter(([, v]) => v)
            .map(([k, v]) => `    - ${k}: ${v}`)
            .join("\n"),
        ].join("\n")
      )
      .join("\n")
  );
}

if (require.main === module) {
  main();
}
