import puppeteer from "puppeteer-core";
import { createServer } from "vite";
import path from "node:path";
import { characters, actionCards } from "@gi-tcg/static-data";

let executablePath = process.env.BROWSER_PATH;

if (!executablePath) {
  const { install, Browser } = await import("@puppeteer/browsers");
  executablePath = (
    await install({
      browser: Browser.CHROME,
      buildId: "132.0.6834.83",
      cacheDir: "temp",
    })
  ).executablePath;
}

const browser = await puppeteer.launch({
  executablePath,
  defaultViewport: {
    width: 480,
    height: 640,
  },
  headless: false,
});

const page = await browser.newPage();

const PORT = 1337;
const WORKSPACE_PATH = path.resolve(import.meta.dirname, "..");
const OUTPUT_PATH = path.resolve(WORKSPACE_PATH, "dist");

const server = await createServer({
  root: WORKSPACE_PATH,
  configFile: path.resolve(WORKSPACE_PATH, "vite.config.ts"),
  server: {
    port: 1337,
  },
});
await server.listen();

await page.goto(server.resolvedUrls!.local[0]!);

async function getCharacter(id: number) {
  await page.evaluate((id) => window.showCharacter(id), id);
  await page.waitForNetworkIdle();
  await page.evaluate(() =>
    document.querySelectorAll("details").forEach((e) => (e.open = true)),
  );
  await page.waitForNetworkIdle();
  const buf = await page
    .$("#root")
    .then((e) => e!.screenshot({ quality: 100, type: "webp" }));
  await Bun.write(path.resolve(OUTPUT_PATH, `${id}.webp`), buf);
}


async function getCard(id: number) {
  await page.evaluate((id) => window.showCard(id), id);
  await page.waitForNetworkIdle();
  const buf = await page
    .$("#root")
    .then((e) => e!.screenshot({ quality: 100, type: "webp" }));
  await Bun.write(path.resolve(OUTPUT_PATH, `${id}.webp`), buf);
}

for (const ch of characters) {
  await getCharacter(ch.id);
}
for (const ac of actionCards) {
  await getCard(ac.id);
}

