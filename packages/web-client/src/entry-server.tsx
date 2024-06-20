import { renderToStringAsync } from "solid-js/web"
import App from "./App";

export async function render() {
  const html = await renderToStringAsync(() => <App />);
  return { html };
}
