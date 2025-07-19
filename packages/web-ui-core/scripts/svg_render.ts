import { $, Glob } from "bun";
import puppeteer from "puppeteer";
import {
  PuppeteerScreenRecorder,
  PuppeteerScreenRecorderOptions,
} from "puppeteer-screen-recorder";
import path from "node:path";
import { mkdir } from "node:fs/promises";

const port = 3000;

const svgFolder = path.join(import.meta.dirname, "../src/svg");
const outFolder = path.join(import.meta.dirname, "../out");

await mkdir(outFolder, { recursive: true });

const server = Bun.serve({
  routes: {
    "/*": async (req) => {
      const { pathname } = new URL(req.url);
      const content = await Bun.file(path.join(svgFolder, pathname)).text();
      return new Response(
        `<!DOCTYPE html>
<link rel="icon" href="data:,">
<style>
  body { margin: 0; height: 100vh; width: 100vw; overflow: clip; background: transparent; }
  svg { max-height: 100vh; max-width: 100vw; }
</style>
<body>${content}</body>
</html>`,
        {
          headers: {
            "Content-Type": "text/html",
          },
        },
      );
    },
  },
  port,
});

const url = `http://${server.hostname}:${server.port}/`;

console.log(`SVG server running at ${url}`);

const browser = await puppeteer.launch({
  headless: false,
});
const page = await browser.newPage();

const ANIMATED: Record<string, number> = {
  "NightsoulsBlessingMask.svg": 6000,
  "EnergyIconActiveGain.svg": 4000,
  "EnergyIconActiveGainMavuika.svg": 4000,
  "EnergyIconExtraGainMavuika.svg": 4000,
  "SelectingIcon.svg": 10_000,
};

for await (const file of new Glob("*.svg").scan(svgFolder)) {
  await page.setViewport({
    width: 400,
    height: 400,
  });
  await page.goto(`${url}${file}`, { waitUntil: "networkidle0" });
  const el = await page.$("svg");
  if (!el) {
    console.error(`SVG element not found for ${file}`);
    continue;
  }
  const info = await el.evaluate((el) => {
    return {
      height: el?.clientHeight,
      width: el?.clientWidth,
    };
  });
  await page.setViewport(info);
  if (ANIMATED[file]) {
    console.log(`Render animated SVG for ${file}...`);
    await Bun.sleep(500); // Wait for magic happens...
    const recorder = new PuppeteerScreenRecorder(page, {
    } as PuppeteerScreenRecorderOptions);
    await recorder.start(`${outFolder}/${file}.webm`);
    console.log(`Waiting for ${ANIMATED[file]}ms...`);
    await Bun.sleep(ANIMATED[file]);
    await recorder.stop();
  } else {
    console.log(`Render static SVG for ${file}...`);
    const outfile = `${outFolder}/${file}.webp` as const;
    await page.screenshot({
      type: "webp",
      quality: 100,
      fullPage: true,
      omitBackground: true,
      path: outfile,
    });
    // await $`magick ${outfile} -fuzz 5% -transparent "#0f0" ${outfile}`;
  }
}

await browser.close();
await server.stop();
