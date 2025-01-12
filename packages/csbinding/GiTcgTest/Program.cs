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

using GiTcg;

var deck0 = new Deck
{
  Characters = [1411, 1510, 2103],
  Cards = [214111, 214111, 215101, 311503, 312004, 312004, 312025, 312025, 312029, 312029, 321002, 321011, 321016, 321016, 322002, 322009, 322009, 330008, 332002, 332002, 332004, 332004, 332005, 332005, 332006, 332006, 332018, 332025, 333004, 333004]
};
var deck1 = new Deck
{
  Characters = [1609, 2203, 1608],
  Cards = [312025, 321002, 321002, 321011, 322025, 323004, 323004, 330005, 331601, 331601, 332002, 332003, 332003, 332004, 332004, 332005, 332005, 332006, 332025, 332025, 333003, 333003]
};

var create_param = new CreateParam(deck0, deck1);
var state = new State(create_param);

Console.WriteLine(GiTcg.GiTcg.Version());

var game = new Game(state);

game.SetPlayer(0, new TrivialPlayer());
game.SetPlayer(1, new TrivialPlayer());

game.Start();
while (game.Running)
{
  game.Step();
}

Console.WriteLine(game.State().ToJson());

class TrivialPlayer : IPlayer
{
  public GiTcg.Proto.ActionResponse OnAction(GiTcg.Proto.ActionRequest request)
  {
    for (int i = 0; i < request.Action.Count; i++)
    {
      var action = request.Action[i];
      if (action.DeclareEnd is not null)
      {
        return new GiTcg.Proto.ActionResponse { ChosenActionIndex = i };
      }
    }
    throw new NotImplementedException();
  }

  public GiTcg.Proto.ChooseActiveResponse OnChooseActive(GiTcg.Proto.ChooseActiveRequest request)
  {
    return new GiTcg.Proto.ChooseActiveResponse { ActiveCharacterId = request.CandidateIds[0] };
  }

  public void OnIoError(string error_msg)
  {
    Console.WriteLine(error_msg);
  }

  public void OnNotification(GiTcg.Proto.Notification notification)
  {

  }

  public GiTcg.Proto.RerollDiceResponse OnRerollDice(GiTcg.Proto.RerollDiceRequest request)
  {
    return new GiTcg.Proto.RerollDiceResponse();
  }

  public GiTcg.Proto.SelectCardResponse OnSelectCard(GiTcg.Proto.SelectCardRequest request)
  {
    return new GiTcg.Proto.SelectCardResponse { SelectedDefinitionId = request.CandidateDefinitionIds[0] };
  }

  public GiTcg.Proto.SwitchHandsResponse OnSwitchHands(GiTcg.Proto.SwitchHandsRequest request)
  {
    return new GiTcg.Proto.SwitchHandsResponse();
  }
}

