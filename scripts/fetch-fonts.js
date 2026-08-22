const fs = require("fs");
const path = require("path");

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

const families = {
  Fraunces:
    "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,900;1,9..144,400;1,9..144,500;1,9..144,600;1,9..144,700;1,9..144,900&display=swap",
  Inter:
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
};

const outDir = path.join(__dirname, "..", "vendor", "fonts");
const outCss = path.join(outDir, "fonts.css");

async function fetchCss(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error("CSS fetch failed: " + res.status);
  return res.text();
}

async function download(url, file) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error("WOFF2 fetch failed: " + url + " " + res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(file, buf);
  return buf.length;
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const parts = [];
  const usedNames = new Set();
  for (const family of Object.keys(families)) {
    let css = await fetchCss(families[family]);
    let idx = 0;
    css = css.replace(/\/\*[\s\S]*?\*\//g, ""); // strip comments
    css = css.replace(/url\((https:[^)]+?)\)/g, (m, url) => {
      idx++;
      let stem = path.basename(new URL(url).pathname).replace(/\.woff2$/, "");
      let name = family + "-" + stem;
      if (usedNames.has(name)) name = family + "-" + stem + "-" + idx;
      usedNames.add(name);
      const file = name + ".woff2";
      download(url, path.join(outDir, file)).then((n) =>
        console.log("  " + file + " (" + n + " bytes)")
      );
      return "url(" + file + ")";
    });
    css = css.replace(/font-family: '[^']+'/g, () => 'font-family: "' + family + '"');
    parts.push(css);
  }
  fs.writeFileSync(outCss, parts.join("\n"));
  console.log("Wrote " + outCss);
})();
