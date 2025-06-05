// Copyright (C) 2025 Guyutongxue
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

export interface AlertProps {
  class?: string;
  text?: string;
}

function renderAlertText(text: string) {
  const parts = text.split(/\[\[\/?color(?::(.*?))?\]\]/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      const color = part;
      const content = parts[i + 1];
      parts[i + 1] = '';
      const style =
        color === 'void' || color === 'omni'
          ? { color: 'inherit' }
          : { color: `var(--c-${color})` };
      return <span style={style}>{content}</span>;
    }
    return part;
  });
}

export function Alert(props: AlertProps) {
  return (
    <div
      class={`w-84 h-16 pointer-events-none flex flex-row justify-center font-bold items-center bg-#786049 border-#bea678 b-3 text-white rounded-1.5 text-4.5 color-#ede4d8 opacity-100 visible animate-[hideAfter_4000ms_forwards] pointer-events-none contain-[layout_paint] ${
        props.class ?? ""
      }`}
      bool:data-shown={props.text}
    >
      {props.text ? renderAlertText(props.text) : undefined}
    </div>
  );
}
