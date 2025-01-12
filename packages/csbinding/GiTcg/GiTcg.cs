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

using System.Text;
using System.Runtime.InteropServices;

public class GiTcg
{
  public static string Version()
  {
    string result;
    unsafe
    {
      var span = MemoryMarshal.CreateReadOnlySpanFromNullTerminated(NativeMethods.gitcg_version());
      result = Encoding.UTF8.GetString(span);
    }
    return result;
  }

  public static void Test() {
    var action = new Proto.Action();
  }
}
