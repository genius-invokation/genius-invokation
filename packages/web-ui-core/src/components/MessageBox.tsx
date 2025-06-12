// Copyright (C) 2024-2025 Guyutongxue
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { createEffect, createSignal, Show, type Component } from "solid-js";

interface MessageBoxOptions {
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export interface MessageBoxController {
  show: (options: MessageBoxOptions) => void;
}

export const createMessageBox = (): [
  controller: MessageBoxController,
  component: Component,
] => {
  const [shown, setShown] = createSignal(false);
  const [message, setMessage] = createSignal<string>("");
  const [onConfirm, setOnConfirm] = createSignal<() => void>(() => {});
  const [onCancel, setOnCancel] = createSignal<() => void | undefined>();

  const show = (options: MessageBoxOptions) => {
    setMessage(options.message);
    setOnConfirm(() => () => {
      options.onConfirm();
      setShown(false);
    });
    setOnCancel(() => () => {
      options.onCancel?.();
      setShown(false);
    });
    setShown(true);
  };

  return [
    { show },
    () => (
      <MessageBox
        shown={shown()}
        message={message()}
        onConfirm={onConfirm()}
        onCancel={onCancel()}
      />
    ),
  ];
};

interface MessageBoxProps {
  shown: boolean;
  class?: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

function MessageBox(props: MessageBoxProps) {
  return (
    <Show when={props.shown}>
      <div class="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-#ebdab7 p-4 rounded-3 shadow-lg w-96 h-48 border-#735a3f b-2">
          <p class="h-24 font-size-6 font-bold mt-4 text-center">{props.message}</p>
          <div class="flex justify-center space-x-2">
            <button
              class="px-3 py-1 w-36 font-bold font-size-5 color-black bg-#e9e2d3 rounded-full border-#735a3f b-2 hover:bg-#e9e2d3 hover:shadow-[inset_0_0_16px_rgba(255,255,255,1)] hover:border-white"
              onClick={() => {
                props.onCancel?.();
              }}
            >
              取消
            </button>
            <button
              class="px-3 py-1 w-36 font-bold font-size-5 color-black bg-#e9e2d3 rounded-full border-#735a3f b-2 hover:bg-#e9e2d3 hover:shadow-[inset_0_0_16px_rgba(255,255,255,1)] hover:border-white"
              onClick={() => {
                props.onConfirm();
              }}
            >
              确认
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}