import puppeteer, { Page, type LaunchOptions } from "puppeteer-core";
import { Cluster } from "puppeteer-cluster";
import { createServer } from "vite";
import path from "node:path";
import { characters, actionCards } from "@gi-tcg/static-data";
import { SingleBar, Presets } from "cli-progress";

const PORT = 1337;
const WORKSPACE_PATH = path.resolve(import.meta.dirname, "..");
const OUTPUT_PATH = path.resolve(WORKSPACE_PATH, "dist");
const CONCURRENCY = 4;

console.log("Starting Vite server...");
const server = await createServer({
  root: WORKSPACE_PATH,
  configFile: path.resolve(WORKSPACE_PATH, "vite.config.ts"),
  server: {
    port: PORT,
  },
});
await server.listen();
const url = server.resolvedUrls!.local[0]!;

let executablePath = process.env.BROWSER_PATH;

if (!executablePath) {
  const { install, Browser } = await import("@puppeteer/browsers");
  const browser = process.env.CI ? Browser.CHROMEHEADLESSSHELL : Browser.CHROME;
  console.log("Installing browser...");
  const progress = new SingleBar({ noTTYOutput: true }, Presets.shades_classic);
  executablePath = (
    await install({
      browser,
      buildId: "132.0.6834.83",
      cacheDir: "temp",
      downloadProgressCallback: (curr, total) => {
        progress.setTotal(total);
        progress.update(curr);
      },
    })
  ).executablePath;
  progress.stop();
}

console.log("Launching puppeteer...");
const cluster: Cluster<void, void> = await Cluster.launch({
  concurrency: Cluster.CONCURRENCY_PAGE,
  maxConcurrency: CONCURRENCY,
  puppeteer,
  timeout: 60_000,
  retryLimit: 3,
  puppeteerOptions: {
    executablePath,
    defaultViewport: {
      width: 480,
      height: 640,
    },
    // headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  } satisfies LaunchOptions,
});

async function getCharacter(page: Page, id: number) {
  await page.evaluate((id) => window.showCharacter(id), id);
  await page.waitForNetworkIdle();
  await page.evaluate(() =>
    document.querySelectorAll("details").forEach((e) => (e.open = true)),
  );
  const buf = await page
    .$("#root")
    .then((e) => e!.screenshot({ quality: 100, type: "webp" }));
  await Bun.write(path.resolve(OUTPUT_PATH, `${id}.webp`), buf);
}

async function getCard(page: Page, id: number) {
  await page.evaluate((id) => window.showCard(id), id);
  await page.waitForNetworkIdle();
  const buf = await page
    .$("#root")
    .then((e) => e!.screenshot({ quality: 100, type: "webp" }));
  await Bun.write(path.resolve(OUTPUT_PATH, `${id}.webp`), buf);
}

const tasks = [
  ...characters.map((ch) => (page: Page) => getCharacter(page, ch.id)),
  ...actionCards.map((ac) => (page: Page) => getCard(page, ac.id)),
];

console.log("Running tasks...");
const progress = new SingleBar({ noTTYOutput: true }, Presets.shades_classic);
progress.start(tasks.length, 0);

cluster.on("taskerror", (err, data, willRetry) => {
  if (!willRetry) {
    console.log(`Error: ${err.message}`);
  }
});

for (const task of tasks) {
  cluster.queue(async ({ page }) => {
    await page.goto(url);
    await task(page);
    progress.increment();
  });
}

await cluster.idle();
progress.stop();
// buggy
// await cluster.close();
process.exit();
