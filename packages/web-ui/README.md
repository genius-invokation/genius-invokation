# `@gi-tcg/web-ui` Web UI for Genius Invokation

> **Warning**
>
> This is an ESM-only package.

## Usage

```js
import { createClient } from "@gi-tcg/web-ui";

// Inject a player chessboard with IO
const io0 = createClient(document.querySelector("#player0"), 0);

// Acquire a show-only standalone chessboard (using Web Component)
const chessboard = document.createElement("gi-tcg-standalone-chessboard");
chessboard.stateData = /* ... */;
document.body.append(chessboard);
```

A live example can be found [here](https://stackblitz.com/edit/gi-tcg-example?file=src%2Fmain.js).
