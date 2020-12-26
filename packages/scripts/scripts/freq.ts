import { Db } from "liteorm";
import fs from "fs";
import runes from "runes2";
import tb from "../api/_db/local";
import yaml from "js-yaml";

function clone<T>(o: T): T {
  return JSON.parse(JSON.stringify(o));
}

async function main() {
  const db = new Db("api/unicode.db");
  await db.init(Object.values(tb));

  const unicode = new Map<string, null>();

  await db
    .all(tb.unicode)(
      {},
      {
        symbol: tb.unicode.c.symbol,
      }
    )
    .then((rs) =>
      rs.map((r) => {
        if (!/[\x20-\x7F]/.test(r.symbol)) {
          unicode.set(r.symbol, null);
        }
      })
    );

  await db.close();

  const freqMap = new Map<
    string,
    {
      f: number;
    }
  >();
  for (const c of runes(fs.readFileSync("raw/reddit.txt", "utf-8"))) {
    let prev = freqMap.get(c);

    if (unicode.has(c) || prev) {
      prev = prev || {
        f: 0,
      };
      prev.f++;

      unicode.delete(c);
      freqMap.set(c, prev);
    }
  }

  Array.from(unicode.keys()).map((c) => freqMap.set(c, { f: 0 }));
  const sum = Array.from(freqMap.values()).reduce((prev, c) => prev + c.f, 0);

  const sortedData = Array.from(freqMap)
    .sort(([, a], [, b]) => b.f - a.f)
    .map(([k, v]) => {
      return clone({
        ascii:
          "0x" +
          k
            .split("")
            .map((c) => c.charCodeAt(0).toString(16))
            .join(""),
        entry: k,
        frequency: (v.f / sum) * 100 || undefined,
      });
    });

  fs.writeFileSync("../../data/frequency.yaml", yaml.safeDump(sortedData));
  fs.writeFileSync(
    "../../data/frequency.md",
    sortedData
      .map(
        (d) =>
          `- ${d.entry}${d.ascii ? ` (${d.ascii})` : ""} ${d.frequency || ""}`
      )
      .join("\n")
  );
}

if (require.main === module) {
  main();
}
