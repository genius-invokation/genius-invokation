# `@gi-tcg/legacy-web-ui-core` (Deprecated) Web UI Core for Genius Invokation

> **Warning**
>
> This package is deprecated. Use `@gi-tcg/web-ui-core` instead.
> This is an ESM-only package.

## Usage

```tsx
import { createPlayer } from "@gi-tcg/legacy-web-ui-core";
import "@gi-tcg/legacy-web-ui-core/style.css";

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
