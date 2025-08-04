import { children, type ComponentProps } from "solid-js";

export function AspectRatioContainer(props: ComponentProps<"div">) {
  const child = children(() => props.children);
  return (
    <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div
        class={`absolute aspect-ratio-[16/9] h-full max-w-full flex-grow-0 flex-shrink-0 children-pointer-events-auto ${
          props.class ?? ""
        }`}
        {...props}
      >
        {child()}
      </div>
    </div>
  );
}
