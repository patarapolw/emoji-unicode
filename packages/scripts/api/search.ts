import { NowRequest, NowResponse } from "@now/node";
import { Record, String, Undefined } from "runtypes";

import { Db } from "liteorm";
import QSearch from "@patarapolw/qsearch";
import tb from "./_db/local";

let db: Db | null = null;

export default async (req: NowRequest, res: NowResponse) => {
  const { q, offset: offsetStr, limit: limitStr, sort, order } = Record({
    q: String,
    offset: String,
    limit: String.Or(Undefined),
    sort: String.Or(Undefined),
    order: String,
  }).check(req.query);

  const offset = parseInt(offsetStr);
  const limit = parseInt(limitStr || "") || 5;

  if (!db) {
    db = new Db(`${__dirname}/unicode.db`);
    await db.init(Object.values(tb));
  }

  const qSearch = new QSearch({
    dialect: "native",
    schema: {
      unicode: {},
      frequency: { type: "number" },
      type: { isAny: false },
      description: {},
      symbol: {},
      input: {},
    },
  });

  // console.log(qSearch.parse(q).cond)

  // const { symbol, description, type, frequency } = qSearch.parse(q).cond
  let data = await Promise.all(
    (
      await db.all(tb.unicode)(
        {
          // symbol, description, type, frequency
        },
        {
          id: tb.unicode.c.id,
          ascii: tb.unicode.c.ascii,
          symbol: tb.unicode.c.symbol,
          description: tb.unicode.c.description,
          type: tb.unicode.c.type,
          frequency: tb.unicode.c.frequency,
        },
        {
          sort: sort
            ? {
                key: sort,
                desc: order === "desc",
              }
            : {
                key: "frequency",
                desc: true,
              },
        }
      )
    ).map(async (el) => {
      const alt: any[] = [
        // el.symbol
      ];

      alt.push(
        ...(
          await db!.all(tb.repr)(
            { unicodeId: el.id! },
            {
              unicodeId: tb.repr.c.unicodeId,
              repr: tb.repr.c.repr,
            }
          )
        ).map((r) => r.repr)
      );

      if (el.ascii) {
        alt.push(`&#x${el.ascii.toString(16)};`, `&#${el.ascii};`);
        (el as any).unicode = [
          el.ascii.toString(16),
          el.ascii.toString(),
        ] as any;
      }

      (el as any).input = alt;

      return el;
    })
  );

  data = qSearch.filter(q, data);

  const count = data.length;
  data = data.slice(offset, offset + limit);

  res.json({ count, data });
};
