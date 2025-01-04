import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import babel from "@rollup/plugin-babel";
import { WEB_CLIENT_BASE_PATH } from "@gi-tcg/config";
import define from "@gi-tcg/config/vite_define";
import { readdirSync } from "node:fs";

const AVATARS_BASE_PATH = "public/avatars";
const AVATARS = [...readdirSync(AVATARS_BASE_PATH)];

export default defineConfig({
  esbuild: {
    target: "ES2020",
  },
  base: WEB_CLIENT_BASE_PATH,
  plugins: [
    solid(),
    babel({
      babelHelpers: "bundled",
    }),
  ],
  define: {
    ...define,
    AVATARS: JSON.stringify(AVATARS),
  },
});
