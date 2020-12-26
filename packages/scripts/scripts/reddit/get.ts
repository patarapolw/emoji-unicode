import axios from "axios";
import fs from "fs";
import rateLimit from "axios-rate-limit";

declare global {
  interface Array<T> {
    mapAsync<U>(
      callbackfn: (value: T, index: number, array: T[]) => U | Promise<U>,
      thisArg?: any
    ): Promise<U[]>;
  }
}

Array.prototype.mapAsync = async function (callbackfn, thisArg) {
  return Promise.all(this.map(callbackfn, thisArg));
};

function dotProp<R>(o: any, p: string | string[], def?: R): R {
  if (typeof o === "undefined") {
    return def!;
  }

  const ps = typeof p === "string" ? p.split(".") : p;

  if (!ps.length) {
    return o;
  }

  if (o && typeof o === "object") {
    if (Array.isArray(o)) {
      return dotProp(o[parseInt(ps[0])], ps.slice(1), def);
    }

    return dotProp(o[ps[0]], ps.slice(1), def);
  }

  return def!;
}

const api = rateLimit(
  axios.create({
    baseURL: "https://oauth.reddit.com",
    headers: {
      Authorization: `Bearer ${
        JSON.parse(fs.readFileSync("token.json", "utf-8")).access_token
      }`,
    },
  }),
  {
    /**
     * Clients connecting via OAuth2 may make up to 60 requests per minute.
     */
    maxRequests: 60,
  }
);

function iterListing(apiPath = "/hot", count = 1000) {
  const limit = 50;
  const maxDepth = Math.ceil(count / limit);

  return {
    [Symbol.asyncIterator]() {
      return {
        depth: 0,
        after: "",
        async next() {
          if (!this.after && this.depth) {
            return { done: true };
          }

          if (this.depth < maxDepth) {
            this.depth++;

            const value = await api
              .get(apiPath, {
                params: {
                  after: this.after,
                  limit,
                },
              })
              .then((r) => {
                this.after = dotProp<string>(r, "data.data.after");
                console.log(this.depth, this.after);

                return dotProp<any[]>(r, "data.data.children", []).mapAsync(
                  async ({ data: { name } }) => {
                    return api
                      .get("/comments/" + name.split("_")[1])
                      .then((r) => {
                        const getComment = ({ data: { body = "", replies } }) =>
                          body +
                          "\n" +
                          (replies
                            ? dotProp<any[]>(replies, "data.children")
                                .map((r) => getComment(r))
                                .join("\n")
                            : "");

                        return `${dotProp(
                          r,
                          "data.0.data.children.0.data.title",
                          ""
                        )}\n${dotProp(
                          r,
                          "data.0.data.children.0.data.selftext",
                          ""
                        )}\n${dotProp<any[]>(r, "data.1.data.children", [])
                          .map((r) => getComment(r))
                          .join("\n")}`;
                      });
                  }
                );
              });

            return {
              done: false,
              value,
            };
          }

          return {
            done: true,
          };
        },
      };
    },
  };
}

async function main() {
  const outStream = fs.createWriteStream("raw/reddit.txt", {
    flags: "w",
    encoding: "utf-8",
  });

  try {
    console.log("Getting /hot");
    for await (const out of iterListing("/hot")) {
      if (out) {
        out.map((it) => outStream.write(it + "\n"));
      }
    }
  } catch (e) {
    console.error(e.response || e);
  }

  try {
    console.log("Getting /top");
    for await (const out of iterListing("/top")) {
      if (out) {
        out.map((it) => outStream.write(it + "\n"));
      }
    }
  } catch (e) {
    console.error(e.response || e);
  }

  outStream.close();
}

if (require.main === module) {
  main();
}
