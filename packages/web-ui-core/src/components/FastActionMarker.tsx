import { Show } from "solid-js";

export interface FastActionMarkerProps {
  shown?: boolean;
}

export function FastActionMarker(props: FastActionMarkerProps) {
  return (
    <Show when={props.shown}>
      <div class="absolute bottom-10% left-50% translate-x--50% text-center text-white bg-yellow-500/80 rounded-lg px-2 py-1 text-xs">快速行动</div>
    </Show>
  );
}
