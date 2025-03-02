import { renderToStringAsync } from "solid-js/web";
import { LocalStorage } from "node-localstorage";

global.localStorage = new LocalStorage(`${import.meta.dirname}/../temp`);

export async function render() {
  const { default: App } = await import("./App");
  const html = await renderToStringAsync(() => <App />);
  return { html };
}
