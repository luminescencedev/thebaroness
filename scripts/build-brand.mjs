// Génère favicon, icônes d'app et image de partage à partir du médaillon.
// Usage : node scripts/build-brand.mjs   (utilise Chromium de Playwright)
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const pub = "public";
const spokes = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4;
  const f = (n) => n.toFixed(2);
  return `<path d="M${f(Math.cos(a) * 2.2)} ${f(Math.sin(a) * 2.2)}L${f(Math.cos(a) * 4.9)} ${f(Math.sin(a) * 4.9)}" stroke="#B4ABFF" stroke-width="1" stroke-linecap="round"/>`;
}).join("");
const medal = `<g transform="translate(16 16) scale(2.6)"><circle r="6.1" fill="#B4ABFF" fill-opacity=".07"/><circle r="5.3" fill="none" stroke="#B4ABFF" stroke-width="1.15"/>${spokes}<circle r="2.2" fill="#0b0c10" stroke="#B4ABFF" stroke-width=".9"/><circle r="1.05" fill="#F4F5F7"/><circle r=".45" fill="#060709"/></g>`;
const medalSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}" fill="none">${medal}</svg>`;
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none"><rect width="64" height="64" rx="15" fill="#060709"/><rect x="1.5" y="1.5" width="61" height="61" rx="13.5" stroke="#fff" stroke-opacity=".12" stroke-width="1.5"/><g transform="translate(8 8) scale(1.5)">${medal}</g></svg>`;
fs.writeFileSync(path.join(pub, "favicon.svg"), favicon + "\n");

const geist = path.resolve("node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2");
const font = `@font-face{font-family:Geist;src:url(data:font/woff2;base64,${fs.readFileSync(geist).toString("base64")}) format("woff2");font-weight:100 900}`;

const browser = await chromium.launch();
const page = await browser.newPage();

async function png(html, width, height, file) {
  await page.setViewportSize({ width, height });
  await page.setContent(`<style>${font}html,body{margin:0;background:transparent}</style>${html}`);
  await page.evaluate(() => document.fonts.ready);
  const buf = await page.screenshot({ type: "png", omitBackground: true, clip: { x: 0, y: 0, width, height } });
  if (file) fs.writeFileSync(path.join(pub, file), buf);
  return buf;
}
const framed = (size) => `<div style="width:${size}px;height:${size}px">${favicon.replace('width="64" height="64"', `width="${size}" height="${size}"`)}</div>`;

const sizes = { 16: null, 32: "favicon-32.png", 48: null, 180: "apple-touch-icon.png", 512: "icon-512.png" };
const bufs = {};
for (const [size, file] of Object.entries(sizes)) bufs[size] = await png(framed(Number(size)), Number(size), Number(size), file);

// favicon.ico : trois images PNG (16, 32, 48).
const entries = [16, 32, 48].map((s) => ({ s, data: bufs[s] }));
const head = Buffer.alloc(6 + 16 * entries.length);
head.writeUInt16LE(1, 2);
head.writeUInt16LE(entries.length, 4);
let offset = head.length;
entries.forEach((e, i) => {
  const o = 6 + i * 16;
  head.writeUInt8(e.s, o);
  head.writeUInt8(e.s, o + 1);
  head.writeUInt16LE(1, o + 4);
  head.writeUInt16LE(32, o + 6);
  head.writeUInt32LE(e.data.length, o + 8);
  head.writeUInt32LE(offset, o + 12);
  offset += e.data.length;
});
fs.writeFileSync(path.join(pub, "favicon.ico"), Buffer.concat([head, ...entries.map((e) => e.data)]));

// Image de partage 1200 x 630.
const og = `<div style="width:1200px;height:630px;position:relative;overflow:hidden;background:#060709;font-family:Geist,sans-serif;color:#F4F5F7">
<div style="position:absolute;inset:0;background:radial-gradient(60% 70% at 78% 40%,rgba(91,75,240,.45),transparent 70%),radial-gradient(40% 50% at 10% 100%,rgba(91,75,240,.18),transparent 70%)"></div>
<div style="position:absolute;right:70px;top:110px;opacity:.95">${medalSvg(400)}</div>
<div style="position:absolute;left:80px;top:80px;display:flex;align-items:center;gap:16px">${medalSvg(56)}<span style="font-size:40px;font-weight:600;letter-spacing:-.045em">the baroness.</span></div>
<div style="position:absolute;left:80px;top:250px;width:660px;font-size:78px;line-height:1.04;font-weight:600;letter-spacing:-.04em;background:linear-gradient(180deg,#fff 30%,#8c92a0);-webkit-background-clip:text;color:transparent">Vos stats Deadlock, lues en une seconde.</div>
<div style="position:absolute;left:80px;bottom:70px;font-size:26px;color:#A1A7B3">Rang, héros, parties et progression de n'importe quel joueur</div>
</div>`;
const ogBuf = await png(og, 1200, 630, null);
fs.writeFileSync(path.join(pub, "og-default.png"), ogBuf);

fs.writeFileSync(
  path.join(pub, "site.webmanifest"),
  JSON.stringify(
    {
      name: "The Baroness",
      short_name: "Baroness",
      icons: [
        { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      theme_color: "#060709",
      background_color: "#060709",
      display: "standalone",
    },
    null,
    2,
  ) + "\n",
);
await browser.close();
console.log("favicon.svg, favicon.ico, favicon-32.png, apple-touch-icon.png, icon-512.png, og-default.png, site.webmanifest");
