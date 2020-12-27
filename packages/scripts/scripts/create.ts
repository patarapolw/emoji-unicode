import fs from "fs";
import runes from "runes2";
import sqlite3 from "better-sqlite3";

interface IHTMLCodes {
  symbol: string;
  description: string;
  html?: string;
}

interface IEmojis {
  emoji: string;
  name: string;
  shortname: string;
  unicode: string;
  html: string;
  category: string;
  order: number;
}

interface IShowdown {
  ascii: string;
  symbol: string;
  description: string;
}

async function createDatabase() {
  const db = sqlite3("api/unicode.db");

  db.exec(/* sql */ `
  CREATE TABLE [unicode] (
    [entry]     TEXT PRIMARY KEY,
    frequency   FLOAT,
    meta        JSON DEFAULT '{}'
  );

  CREATE INDEX unicode_frequency ON [unicode](frequency);
  `);

  db.exec(/* sql */ `
  CREATE VIRTUAL TABLE q USING fts5(
    [entry],
    [unicode],
    alias,          -- arr.join(' ')
    [is],
    tag,            -- arr.join(' ')
    [description]   -- arr.join(' ')
  );
  `);

  {
    const stmtUni = db.prepare(/* sql */ `
    INSERT INTO [unicode] ([entry], meta)
    VALUES (@entry, json_set('{}', '$.htmlcodes', json(@meta)))
    `);

    db.transaction(() => {
      for (const r of JSON.parse(
        fs.readFileSync("raw/htmlcodes.json", "utf-8")
      ) as IHTMLCodes[]) {
        if (!/^[\x20-\x7f]$/.test(r.symbol)) {
          stmtUni.run({
            entry: r.symbol,
            meta: JSON.stringify(r),
          });
        }
      }
    })();
  }

  {
    const stmtUni = db.prepare(/* sql */ `
    INSERT INTO [unicode] ([entry], meta, frequency)
    VALUES (@entry, json_set('{}', '$.emojis', json(@meta)), @frequency)
    ON CONFLICT ([entry])
    DO UPDATE
    SET
      meta = json_set(meta, '$.emojis', json(@meta)),
      frequency = @frequency
    `);

    const { emojis } = JSON.parse(
      fs.readFileSync("raw/emojis.json", "utf-8")
    ) as {
      emojis: IEmojis[];
    };

    db.transaction(() => {
      for (const r of emojis) {
        const frequency = r.order ? Math.log(r.order) + 1 : null;

        stmtUni.run({
          entry: r.emoji,
          meta: JSON.stringify({
            ...r,
            frequency,
          }),
          frequency,
        });
      }
    })();
  }

  {
    const stmtUni = db.prepare(/* sql */ `
    INSERT INTO [unicode] ([entry], meta, frequency)
    VALUES (@entry, json_set('{}', '$.showdown', json(@meta)), @frequency)
    ON CONFLICT ([entry])
    DO UPDATE
    SET
      meta = json_set(meta, '$.showdown', json(@meta)),
      frequency = COALESCE(frequency, 0) + @frequency
    `);

    db.transaction(() => {
      for (const r of JSON.parse(
        fs.readFileSync("raw/showdown.json", "utf-8")
      ) as IShowdown[]) {
        if (r.symbol && !/^[\x20-\x7f]$/.test(r.symbol)) {
          const frequency = 2;

          stmtUni.run({
            entry: r.symbol,
            meta: JSON.stringify({
              ...r,
              frequency,
            }),
            frequency,
          });
        }
      }
    })();
  }

  const freqMap = new Map<
    string,
    {
      reddit: number;
    }
  >();

  db.prepare(
    /* sql */ `
  SELECT [entry] FROM [unicode]
  `
  )
    .all()
    .map((r) => freqMap.set(r.entry, { reddit: 0 }));

  for (const c of runes(fs.readFileSync("raw/reddit.txt", "utf-8"))) {
    let prev = freqMap.get(c);

    if (prev) {
      prev.reddit++;
      freqMap.set(c, prev);
    }
  }
  const sumReddit = Array.from(freqMap.values()).reduce(
    (prev, c) => prev + c.reddit,
    0
  );

  {
    const stmt = db.prepare(/* sql */ `
    UPDATE [unicode]
    SET
      frequency = COALESCE(frequency, 0) + @frequency,
      meta = json_set(meta, '$.reddit', json(@meta))
    WHERE [entry] = @entry
    `);

    db.transaction(() => {
      for (const [c, r] of freqMap) {
        if (r.reddit) {
          stmt.run({
            entry: c,
            frequency: (r.reddit / sumReddit) * 100,
            meta: JSON.stringify({ count: r.reddit, sum: sumReddit }),
          });
        }
      }
    })();
  }

  {
    const stmtQ = db.prepare(/* sql */ `
    INSERT INTO q ([entry], [unicode], alias, [is], tag, [description])
    VALUES (@entry, @unicode, @alias, @is, @tag, @description)
    `);

    db.transaction(() => {
      for (const r of db
        .prepare(
          /* sql */ `
        SELECT [entry], meta FROM [unicode]
        `
        )
        .all()) {
        const entry: string = r.entry;
        const meta: {
          htmlcodes?: IHTMLCodes;
          emojis?: IEmojis;
          showdown?: IShowdown;
          reddit?: {};
        } = JSON.parse(r.meta);

        stmtQ.run({
          entry,
          unicode:
            meta.emojis?.unicode ||
            [...entry]
              .map((c) => (c.codePointAt(0) || c.charCodeAt(0)).toString(16))
              .join(" "),
          alias: [
            meta.htmlcodes?.html,
            meta.emojis?.html,
            meta.emojis?.shortname,
            meta.showdown?.description,
          ]
            .filter((c) => c)
            .join(" "),
          is: meta.emojis || meta.showdown ? "emoji" : "unicode",
          tag: [
            meta.htmlcodes ? "html" : "",
            meta.showdown ? "showdown" : "",
            meta.reddit ? "reddit" : "",
          ]
            .filter((c) => c)
            .join(" "),
          description: [
            meta.htmlcodes?.description,
            meta.emojis?.name,
            meta.emojis?.category,
          ]
            .filter((c) => c)
            .join(" "),
        });
      }
    })();
  }

  db.close();
}

if (require.main === module) {
  createDatabase();
}
