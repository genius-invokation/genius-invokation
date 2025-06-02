// Copyright (C) 2025 Guyutongxue, CherryC9H13N
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

export function ChessboardBackground() {
  return (
    <div class="absolute inset-0 flex items-center justify-center">
      <div class="aspect-ratio-[16/9] h-full max-w-full flex-grow-0 flex-shrink-0 flex items-center justify-center">
        <div class="aspect-ratio-[16/9] w-full max-h-full flex-grow-0 flex-shrink-0 bg-#554433 flex items-center justify-center">
          <div class="w-95% h-85% flex-grow-0 flex-shrink-0 bg-[linear-gradient(to_bottom,#F0FDF4_49.5%,#DDEEDD_50%,#F0FDF4_50.5%)] rounded-15% border-6 border-#443322 shadow-[inset_0_0_18px_#000000,_0_0_40px_#63524a]" />
        </div>
      </div>
    </div>
  );
}
