import { optimize } from "svgo";
import { Plugin, ResolvedConfig } from "vite";
import { readFile } from "node:fs/promises";

async function compileSvg(source: string) {
  const svgSource = source
    .replace(/([{}])/g, "{'$1'}")
    .replace(/<!--\s*([\s\S]*?)\s*-->/g, "{/* $1 */}");
  // .replace(/(<svg[^>]*)>/i, "$1{...props}>")
  return `import { Portal } from "solid-js/web";
export default (props = {}) => {
  let div;
  return (
    <div ref={div} {...props}>
      <Portal mount={div} useShadow={true}>${svgSource}</Portal>
    </div>
  );
}
`;
}

async function optimizeSvg(content: string, path: string) {
  const result = optimize(content, { path });
  return result.data;
}

export default function svgWithFallback(): Plugin {
  const extPrefix = "fb";
  const shouldProcess = (qs: string) => {
    const params = new URLSearchParams(qs);
    return params.has(extPrefix);
  };

  let config: ResolvedConfig;
  let solidPlugin: Plugin;
  return {
    enforce: "pre",
    name: "solid-svg",

    configResolved(cfg) {
      config = cfg;
      solidPlugin = config.plugins.find((p) => p.name === "solid");
      if (!solidPlugin) {
        throw new Error("solid plugin not found");
      }
    },

    async load(id) {
      const [path, qs] = id.split("?");

      if (!path.endsWith(".svg")) {
        return null;
      }

      if (shouldProcess(qs)) {
        let code = await readFile(path, { encoding: "utf8" });
        code = await optimizeSvg(code, path);
        const result = await compileSvg(code);
        return result;
      }
    },

    transform(source, id, transformOptions) {
      const [path, qs] = id.split("?");
      if (path.endsWith(".svg") && shouldProcess(qs)) {
        const transformFn =
          typeof solidPlugin.transform === "function"
            ? solidPlugin.transform
            : solidPlugin.transform.handler;
        return transformFn.bind(this)(source, `${path}.tsx`, transformOptions);
      }
    },
  };
}
