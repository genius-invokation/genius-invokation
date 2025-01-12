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

namespace GiTcg;

abstract public class ObjBase {
  static ObjBase() {
    NativeMethods.gitcg_initialize();
    var threadInit = new ThreadLocal<ValueTuple>(ThreadInit);
    _ = threadInit.Value;
  }

  public static ValueTuple ThreadInit() {
    NativeMethods.gitcg_thread_initialize();
    return ValueTuple.Create();
  }
  public static void ThreadCleanup() {
    NativeMethods.gitcg_thread_cleanup();
  }
}
