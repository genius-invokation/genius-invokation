

import { PbPhaseType } from "@gi-tcg/typings";
import { Show } from "solid-js";

export interface CurrentTurnHintProps {
  phase: PbPhaseType;
  opp: boolean;
}

export function CurrentTurnHint(props: CurrentTurnHintProps) {
  return (
    <Show when={props.phase <= PbPhaseType.ROLL}>
      <div
        class="h-8 w-24 flex items-center justify-center rounded-full b-2 line-height-none font-bold current-turn-hint text-color-[var(--fg-color)] border-[var(--fg-color)] bg-[var(--bg-color)]"
        data-opp={props.opp}
      >
        {props.opp ? "对方先手" : "我方先手"}
      </div>
    </Show>
  );
}
