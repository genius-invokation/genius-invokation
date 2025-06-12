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

import { onMount } from "solid-js";
import { render } from "solid-js/web";

let dialogRef: HTMLDialogElement | null = null;
let confirmCallback: () => void = () => {};
let cancelCallback: () => void = () => {};
let textEl: HTMLParagraphElement | null = null;

export function messageBox(
  question: string,
  onConfirm: () => void,
  onCancel?: () => void
) {
  confirmCallback = onConfirm;
  cancelCallback = onCancel ?? (() => {});
  if (textEl) textEl.textContent = question;
  dialogRef?.showModal();
}

export function mountMessageBox(target = document.body) {
  const el = document.createElement("div");
  target.appendChild(el);
  render(() => <MessageBox />, el);
}

function MessageBox() {
  onMount(() => {});
  return (
    <dialog
      ref={(el) => (dialogRef = el)}
      class="bg-#ebdab7 p-4 rounded-3 shadow-lg w-96 h-48 border-#735a3f border-2"
    >
      <p
        class="h-24 font-size-6 font-bold mt-4 text-center"
        ref={(el) => (textEl = el)}
      >
        message
      </p>
      <div class="flex justify-center gap-2">
        <button
          class="px-3 py-1 w-36 font-bold font-size-5 color-black bg-#e9e2d3 rounded-full border-#735a3f b-2 hover:bg-#e9e2d3 hover:shadow-[inset_0_0_16px_rgba(255,255,255,1)] hover:border-white"
          onClick={() => {
            dialogRef?.close();
            cancelCallback();
          }}
        >
          取消
        </button>
        <button
          class="px-3 py-1 w-36 font-bold font-size-5 color-black bg-#e9e2d3 rounded-full border-#735a3f b-2 hover:bg-#e9e2d3 hover:shadow-[inset_0_0_16px_rgba(255,255,255,1)] hover:border-white"
          onClick={() => {
            dialogRef?.close();
            confirmCallback();
          }}
        >
          确定
        </button>
      </div>
    </dialog>
  );
}