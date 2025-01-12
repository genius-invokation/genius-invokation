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

public class CreateParam : ObjBase, IDisposable
{
  internal readonly IntPtr handle;
  private bool disposed = false;

  public CreateParam()
  {
    unsafe
    {
      gitcg_state_createparam* param;
      int ret = NativeMethods.gitcg_state_createparam_new(&param);
      if (ret != 0)
      {
        throw new Exception("Failed to create state create param");
      }
      handle = (IntPtr)param;
    }
  }
  public CreateParam(Deck deck0, Deck deck1) : this() {
    SetCharacters(0, deck0.Characters);
    SetCards(0, deck0.Cards);
    SetCharacters(1, deck1.Characters);
    SetCards(1, deck1.Cards);
  }

  public void SetCharacters(int who, int[] characters)
  {
    unsafe
    {
      fixed (int* characters_ptr = characters)
      {
        var ret = NativeMethods.gitcg_state_createparam_set_deck((gitcg_state_createparam*)handle, who, 1, characters_ptr, characters.Length);
        if (ret != 0)
        {
          throw new Exception("Failed to set characters");
        }
      }
    }
  }
  public void SetCards(int who, int[] cards) {
    unsafe
    {
      fixed (int* cards_ptr = cards)
      {
        var ret = NativeMethods.gitcg_state_createparam_set_deck((gitcg_state_createparam*)handle, who, 2, cards_ptr, cards.Length);
        if (ret != 0)
        {
          throw new Exception("Failed to set cards");
        }
      }
    }
  }

  public void Dispose()
  {
    Dispose(disposing: true);
    GC.SuppressFinalize(this);
  }
  private void Dispose(bool disposing)
  {
    if (!disposed)
    {
      if (disposing)
      {
        // dispose managed resources here
      }
      unsafe
      {
        _ = NativeMethods.gitcg_state_createparam_free((gitcg_state_createparam*)handle);
      }
    }
    disposed = true;
  }
  ~CreateParam()
  {
    Dispose(disposing: false);
  }
}
