import { createCardDataViewer } from "@gi-tcg/card-data-viewer";
import "@gi-tcg/card-data-viewer/style.css";
import { onMount } from "solid-js";
import { render, createComponent } from "solid-js/web";

function App() {
  const { CardDataViewer, showCharacter, showCard, showState } =
    createCardDataViewer({
      includesImage: true,
    });
  onMount(() => {
    Reflect.set(window, "showCharacter", showCharacter);
    Reflect.set(window, "showCard", showCard);
    Reflect.set(window, "showEntity", (id: number) =>
      showState("summon", {
        id: 0,
        definitionId: id,
        descriptionDictionary: {},
        hasUsagePerRound: false,
      }),
    );
  });
  return createComponent(CardDataViewer, {});
}

render(() => createComponent(App, {}), document.querySelector("#root")!);
