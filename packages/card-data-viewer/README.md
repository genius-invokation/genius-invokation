# `@gi-tcg/card-data-viewer` GI-TCG Card Info Viewer Component for Solid App

## Usage

```ts
import { createCardDataViewer } from "@gi-tcg/card-data-viewer";

const App = () => {
  const { CardDataViewer, showCharacter, showState, showCard, showSkill } =
    createCardDataViewer({
      // includesImage: true,
    });
  onMount(() => {
    showState(
      "character",
      /* character state data */,
      [
        /* combat status state data */
      ],
    );
    showState("summon", { /* state data */ });
    showState("card", { /* state data */ });
    showCard(212111);
    showCharacter(1610);
    showSkill(12111);
  });
  // [...]
}
```
