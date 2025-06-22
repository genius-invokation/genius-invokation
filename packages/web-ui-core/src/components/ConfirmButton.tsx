import { Show } from "solid-js";
import type { ClickConfirmButtonActionStep } from "../action";
import { Button } from "./Button";

export interface ConfirmButtonProps {
  class?: string;
  step?: ClickConfirmButtonActionStep;
  onClick?: (step: ClickConfirmButtonActionStep) => void;
}

export function ConfirmButton(props: ConfirmButtonProps) {
  return (
    <div
      class={`opacity-0 pointer-events-none data-[shown]:pointer-events-auto data-[shown]:opacity-100 transition-opacity flex flex-col items-center gap-2 ${
        props.class ?? ""
      }`}
      bool:data-shown={props.step}
    >
      <Show when={props.step?.isEffectless}>
        <div class="color-red-500 bg-red-100/80 rounded-lg px-2 py-1 text-xs">
          效果将被无效化
        </div>
      </Show>
      <Button onClick={() => props.step && props.onClick?.(props.step)}>
        {props.step?.confirmText}
      </Button>
    </div>
  );
}
