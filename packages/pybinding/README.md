# Genius Invokation TCG (Python binding)

This Python binding of GI-TCG is based on the C Binding and Python `ctypes` FFI.

A very simple usage example:

```python
from gitcg import Deck, Player, Game, CreateParam

# Set players initial deck
DECK0 = Deck(characters=[1411, 1510, 2103], cards=[214111, 311503, ])
DECK1 = Deck(characters=[1609, 2203, 1608], cards=[312025, 321002, ])

# Initialize the game
create_param = CreateParam(deck0=DECK0, deck1=DECK1)
game = Game(create_param=create_param)

# Start and step the game until end
game.start()
while game.is_running():
    game.step()
```

Here is [a generated API documentation](https://pybinding.gi-tcg.guyutongxue.site).

To write AIs, you can follow the steps below.

## Install gitcg

run `pip install gitcg` to install the latest version of it.

### Build from source

It is not recommended to install `gitcg` from source, as it depends on building the core and cbindings, which will take much longer time and possibily facing more incompatible issues. You can refer to the [worlflow file](../../.github/workflows/main.yml) to build from source.

## Define the Deck

You need to define the deck for both players as the following, the integers are card IDs in the official game data.
```python
from gitcg import Deck
DECK0 = Deck(characters=[1411, 1510, 2103], cards=[214111, 311503, ])
```

- [ ] TODO: define the deck with share code?

### Define create param

Initialize `CreateParam` with decks. It defines the initial state of the game. You can also send optional attributes, such as customized maximum round, initial dice number, always omni dice etc. 
```python
from gitcg import CreateParam
create_param = CreateParam(deck0=DECK0, deck1=DECK1)
```

### Define the Player

To define a Player, you can inherit `gitcg.Player` and implement all abstract methods of it. 
```python
from gitcg import Player

class MyPlayer(Player):
    def on_choose_active(self, request: ChooseActiveRequest) -> ChooseActiveResponse:
        ...
    def on_reroll_dice(self, request: RerollDiceRequest) -> RerollDiceResponse:
        ...
    def on_select_card(self, request: SelectCardRequest) -> SelectCardResponse:
        ...
    def on_switch_hands(self, request: SwitchHandsRequest) -> SwitchHandsResponse:
        ...
    def on_action(self, request: ActionRequest) -> ActionResponse:
        ...
```

You also need to override `on_notify` function, which will peridically send updated states of the game.

The communication is based on Protobuf, you can find the detailed definition in `.proto` files.
For reqeuests and responses, the file is in [here](../../proto/rpc.proto), and for notification the files is in [here](../../proto/notification.proto), which is related to [`State` definition](../../proto/state.proto).

To easier gather information from the state, you can create a `State` from `Notification`, and use `state.query` to query specified entities in the state.

### Create the game

Create the game with players and `CreateParam` as the following:
```python
from gitcg import Game

...  # create_param and MyPlayer defined

game = Game(create_param=create_param)
game.set_player(0, MyPlayer())
game.set_player(1, MyPlayer())
```

### Step the game until end

```python
game.start()
while game.is_running():
    game.step()
```

### check the result and dump logs

After the match is ended (or running in half), you can dump the logs by `TODO` to check the action sequences.

## Training Tips

*This is a very naive proposal, only give a straightforward path to connect DNN models and gitcg. You may need to improve the logic to have better training speed and model performance. The following codes are ALL NOT TESTED!!*

To train the AI, we need to define the `Model`, which has current state and valid actions as input, and action probabilities and/or value estimations as output.
Then, we need to integrate the model with a `AIPlayer`, to interact with the game.
We also need to have a `Learner` to optimize the model, which need to give the reward, calculate loss, and update parameters of the model.
Finally, to speedup the training, we may need to distributedly collect data.

### Model

The simplest model takes current state and action lists as input. Take Value-based models as example, assume we encode the state and actions into a string, and use a LLM to get their representation:

```python
class Model(nn.Module):

    def __init__():
        self.llm = AutoModelforCausalLM("Qwen2.5-7B-Instruct")
        self.last_layer = nn.Linear(x, 1)

    def forward(self, state, actions):
        # we omit tokenizer, and use python fors instead of batches, you need to improve it by your self
        state_str = state_to_str(state)
        action_strs = [action_to_str(x) for x in actions]
        state_rep = self.llm(state_str)
        action_reps = [self.llm(x) for x in action_strs]
        final_answer = torch.stack([torch.cat(state_rep, x) for x in action_reps])
        return final_answer
```

### AIPlayer

We can create an `AIPlayer` based on above model:

```python
class AIPlayer(Player):
    def __init__(self, model):
        self._model = model

    def on_notify(self, notification: Notification):
        self._current_state = State(notification=notification)

    def on_choose_active(self, request: ChooseActiveRequest) -> ChooseActiveResponse:
        actions = choose_active_request_to_actions(request)
        values = self._model(self._current_state, actions)
        return action_to_choose_response(actions[values.argmax().item()])

    def on_reroll_dice(self, request: RerollDiceRequest) -> RerollDiceResponse:
        ...
```

### Learner

We can save data that need to be trained in `AIPlayer`, and perform training when a full episode is collected.

```python
class AIPlayerWithDataCollection(Player):
    def __init__(self, model):
        self._model = model
        self._collected_data = []

    def on_notify(self, notification: Notification):
        self._current_state = State(notification=notification)

    def on_choose_active(self, request: ChooseActiveRequest) -> ChooseActiveResponse:
        actions = choose_active_request_to_actions(request)
        values = self._model(self._current_state, actions)
        self._collected_data.append(copy.deepcopy([
            self._current_state, actions, values
        ]))
        return action_to_choose_response(actions[values.argmax().item()])

    def on_reroll_dice(self, request: RerollDiceRequest) -> RerollDiceResponse:
        ...

class Learner:
    def __init__(self, model):
        self._model = model
        self._optimizer = torch.optim.Adam(model.params(), lr=1e-4)

    def learn(self, collected_data, final_state):
        final_reward = get_reward(final_state, player=0)
        reward_each_sample = get_fine_grained_rewards(final_reward, collected_data)
        losses = 0
        for rev, [state, actions, values] in zip([reward_each_sample, collected_data]):
            loss = calc_loss(self._model, rev, state, actions, values)
            losses += loss
        self._optimizer.zero_grad()
        losses.backward()
        self._optimizer.step()
```

### Distributed training

As most training speed of RLs are constrained by the environment sampling (also possibly `gitcg`), we may need to use multiprocessing to speedup the sampling.

```python
from multiprocessing import Process, Queue

class Worker(Process):
    def __init__(self, qin: Queue, qout: Queue, create_param: CreateParam, player: AIPlayer):
        self._qin = qin
        self._qout = qout
        self._player = AIPlayer
        self._create_param = create_param

    def run(self):
        while True:
            cmd, data = self._qin.get()
            if cmd == 'exit':
                return
            elif cmd == 'update_model':
                self._player._model.set_state_dict(data)
            else:
                raise ValueError(cmd)
            game = Game(create_param=self._create_param)
            game.start()
            while game.is_running():
                game.step()
            self._qout.put([self._player._collected_data, game.state()])

if __name__ == '__main__':
    qout = Queue()
    qin = [Queue() for _ in range(worker_num)]
    workers = [Worker(qin[i], qout, create_param, player) for i in range(worker_num)]
    for w in workers:
        w.start()
    for i in range(1000000):
        data, last_state = qout.get()
        learner.learn(data, last_state)
        state_dict = learner._model.state_dict()
        for q in qin:
            q.put(['update_model', state_dict])
    for q in qin:
        q.put(['exit', None])
    for w in workers:
        w.join()
```
