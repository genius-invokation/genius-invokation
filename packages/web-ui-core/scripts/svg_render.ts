// Copyright (C) 2025 Guyutongxue
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { $, Glob } from "bun";
import puppeteer from "puppeteer-core";
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

const browser = (await puppeteer.launch({
  executablePath: '/usr/bin/microsoft-edge',
  headless: false,
})) as unknown as import("puppeteer").Browser;
const page = await browser.newPage();

const ANIMATED: Record<string, number> = {
  "NightsoulsBlessingMask.svg": 6000,
  "CardFaceLoading.svg": 3600,
  "SummonLoading.svg": 3600,
};
// Animated & transparent, no known method to render it properly
const SKIPS: Record<string, number> = {
  "EnergyIconActiveGain.svg": 4000,
  "EnergyIconActiveGainMavuika.svg": 4000,
  "EnergyIconExtraGainMavuika.svg": 4000,
  "SelectingIcon.svg": 10_000,
};

for await (const file of new Glob("*.svg").scan(svgFolder)) {
  if (SKIPS[file]) {
    continue;
  }
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
      format: "png",
      fps: 25,
      
    } as PuppeteerScreenRecorderOptions);
    await recorder.start(`${outFolder}/${file}`);
    console.log(`Waiting for ${ANIMATED[file]}ms...`);
    await Bun.sleep(ANIMATED[file]);
    await recorder.stop();
    await $`ffmpeg -y -i ${`${outFolder}/${file}/frame-%d.png`} -loop 0 -an -vf "fps=25,scale=${info.width}:${info.height}" ${`${outFolder}/${file}.webp`}`;
  } else {
    console.log(`Render static SVG for ${file}...`);
    const outfile = `${outFolder}/${file}.webp` as const;
    await page.screenshot({
      type: "webp",
      quality: 100,
      omitBackground: true,
      path: outfile,
      clip: { x: 0, y: 0, width: info.width, height: info.height },
    });
    // await $`magick ${outfile} -fuzz 5% -transparent "#0f0" ${outfile}`;
  }
}

await browser.close();
await server.stop();
