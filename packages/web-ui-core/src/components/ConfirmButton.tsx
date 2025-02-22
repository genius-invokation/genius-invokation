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
      class={`opacity-0 data-[shown]:pointer-events-auto data-[shown]:opacity-100 transition-opacity ${
        props.class ?? ""
      }`}
      bool:data-shown={props.step}
    >
      <Button onClick={() => props.step && props.onClick?.(props.step)}>
        {props.step?.confirmText}
      </Button>
    </div>
  );
}
