# `@gi-tcg/webui-core` Web UI Core for Genius Invokation

> **Warning**
>
> This package is not designed for public use yet. You should make `solid-js` as a peer dependency to render things exported from this package. For more common scenario, use `@gi-tcg/webui` package instead.  
> This is an ESM-only package.

## Usage

```tsx
import { createPlayer } from "@gi-tcg/webui-core";
import "@gi-tcg/webui-core/style.css";

function App() {
  const [io0, Chessboard0] = createPlayer(0);
  const [io1, Chessboard1] = createPlayer(1);

  const state = /* ... */
  const game = new Game(state);
  game.players[0].io = io0;
  game.players[1].io = io1;
  
  onMount(() => {
    game.start();
  })

  return (
    <>
      <Chessboard0 />
      <Chessboard1 />
    </>
  );
}
```
