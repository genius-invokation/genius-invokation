import path from "node:path";
import { mkdir, copyFile, rm } from "node:fs/promises";
import { parseArgs } from "node:util";
import { $ } from "bun";

const BASE_DIR = path.resolve(`${import.meta.dirname}/..`);

const FILES = ["dist/extension.js", "README.md", "CHANGELOG.md"];

const PUBLISH_DIR = path.resolve(BASE_DIR, "temp");

async function prepare() {
  await rm(PUBLISH_DIR, { recursive: true, force: true });
  for (const file of FILES) {
    const source = path.resolve(BASE_DIR, file);
    const target = path.resolve(PUBLISH_DIR, file);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(source, target);
  }
  const packageJson = await Bun.file(
    path.resolve(BASE_DIR, "package.json"),
  ).json();
  delete packageJson.scripts;
  delete packageJson.dependencies;
  delete packageJson.devDependencies;
  packageJson.name = packageJson.name.replace("@", "").replace("/", "-");
  await Bun.write(
    path.resolve(PUBLISH_DIR, "package.json"),
    JSON.stringify(packageJson, null, 2),
  );
}

async function createPackage() {
  await prepare();
  await $`bun x '@vscode/vsce' package --no-dependencies`.cwd(PUBLISH_DIR);
}
async function publish() {
  await prepare();
  await $`bun x '@vscode/vsce' publish --no-dependencies`.cwd(PUBLISH_DIR);
}

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    publish: { type: "boolean" },
  },
});

if (values.publish) {
  await publish();
} else {
  await createPackage();
}
