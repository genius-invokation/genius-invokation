# 定义状态、出战状态和召唤物

## 触发时机

所有实体（以及被动技能）的操作会在某一时机触发。在这些实体的 builder chain 中，使用 `.on` 方法来描述接下来的操作是由何事件触发的，如：

```ts
/** 西风大教堂 */
const FavoniusCathedral = card(321006)
  // [...]
  .on("endPhase")         // 结束阶段时：
  .usage(2)               // 可用次数 2
  .heal(2, "my active")   // 治疗我方出战角色 2 点
  .done();
```

可用于 `.on` 的事件包括 [events](./events.md) 列出的标准事件，也可包含[用户自定义事件](./custom_events.md)。

## 触发条件

卡牌描述中，所有冒号之前的部分都是触发的条件：**它们基于事件发生时刻的对局情况进行条件计算，而非后续操作引发的时间点计算**。因此不能简单地在后续的操作中使用 `if` 来实现触发条件，你需要将它们作为 `on` 的参数传入。例：

```ts
/** 摩耶之殿：我方造成元素反应时，伤害 +1 */
const ShrineOfMaya = combatStatus(117032)
  // [...]
  .on("modifyDamage", (c, e) => e.getReaction())
  .increaseDamage(1)
  // [...]
```

所有的触发事件都提供了额外的信息，比如“使用技能后”时间的额外信息为 `c.eventArg`，是一个 `SkillInfo` 对象。所有的异步事件的额外信息都在 `c.eventArg` 内；同步事件则注入在 `c` 参数内，具体参考文档见 [events](./events.md)。

`c.eventArg` 可直接从条件判断函数的第二个参数访问，如 `(c, e) => e.foo()`。

## 可用次数

通过 `.usage` 方法设置响应操作的可用次数。只有当触发条件满足时，可用次数才会扣除；当某次触发事件执行完毕，扣除可用次数到 0 之后，实体会自动弃置。每个事件的响应各有一份 `.usage`，故需要在 `.on` 之后设置对应的 `.usage`。

```ts
/** 温迪：风域 */
const Stormzone = combatStatus(115031)
  // [...]
  .on("deductDiceSwitch")
  .usage(2)
  .deductCost(DiceType.Omni, 1)
  .done();
```

如果不希望可用次数到 0 时自动弃置，则在 `.usage` 的第二参数给出 `{ autoDispose: false }`：

```ts
/** 莫娜：虚影 */
const Reflection = summon(112031)
  // [...]
  .on("beforeDamaged", (c, e) => c.of(e.target).isActive())
  .usage(1, { autoDispose: false })
  .decreaseDamage(1)
  .done();
```

“每回合可用次数”使用 `.usagePerRound`：

```ts
/** 破冰踏雪的回音 */
const BrokenRimesEcho = card(312101)
  .costVoid(2)
  .artifact()
  .on("deductDice", (c, e) => /* [...] */)
  .usagePerRound(1)
  .deductCost(DiceType.Cryo, 1)
  .done();
```

如果卡牌描述为“下一次……”，其实际等价于可用次数为 1，此时可以用快捷方法 `.once(handler, cond)`，如：

```ts
/** 岩与契约 */
const StoneAndContracts = card(331802)
  .costVoid(3)
  .requireCharacterTag("liyue")
  .toCombatStatus()
  .once("actionPhase")   // 下回合开始阶段
  .generateDice(DiceType.Omni, 3)
  .drawCards(1)
  .done();
```

## 变量

使用 `.variable` 为该实体添加一个变量定义，传入初始值；可选地传入最大值。在同一位置重新创建时，若最大值大于初始值，则会累加。`.variable` 必须设置在所有 `.on` 之前。

```ts
/** 提米 */
const Timmie = card(322007)
  .support("ally")
  .variable("pigeon", 1)
  .on("actionPhase")
  .do((c) => /** [...] */)
  .done();
```

> `.usage` 默认创建名为 `usage` 的变量；`.shield` 默认创建名为 `shield` 的变量。

## 小片段（Snippets）

诸如白术护盾、基尼奇状态等实体，经常在多个事件下执行同一套（比较复杂的）操作，为此提供了 Snippets 写法。在实体定义中用 `.defineSnippet` 引入一段小程序，可选地，起一个名字（默认为 `"default"`）：

```ts
const MyStatus = status(xxx)
  .variable("a", 3)
  .defineSnippet((c) => {
    // 一段任意的可放在 .do 中的脚本域代码
    c.damage(DamageType.Piercing, c.getVariable("a"));
    c.setVariable("a", 0);
  })
  // 可以给 snippet 起一个名字
  .defineSnippet("default", (c) => {
    // 一段任意的可放在 .do 中的脚本域代码
    // [...]
  })
  // [...]
```

然后在不同的 `.on` 下面使用 `.callSnippet` 调用：

```ts
const MyStatus = status(xxx)
  .defineSnippet(...)               // 定义小片段 default（缺省片段名）
  .defineSnippet("mySnippet", ...)  // 定义小片段 mySnippet
  .on("actionPhase")
  .callSnippet()                    // 调用小片段 default（缺省片段名）
  .on("endPhase")
  .callSnippet()                    // 调用小片段 default
  .callSnippet("mySnippet")         // 调用小片段 mySnippet
  .done();
```

### 小片段的入参

若定义小片段时显示指定了第二个参数 `e` 的类型，则 `callSnippet` 需要通过一个额外的 getter 函数提供这个 `e` 的值。

```ts
const MyStatus = status(xxx)
  .defineSnippet("default", (c, e: number) => { // <- e 具有 number 类型
    if (e === 1) console.log("called on actionPhase");
    if (e === 2) console.log("called on endPhase");
  })
  .on("actionPhase")
  .callSnippet("default", () => 1) // 需要提供一个 () => number 类型的参数，
                                   // 其返回值传递给小片段的第二形参
  .on("endPhase")
  .callSnippet(() => 2)            // 小片段 default 的名字仍然可以省略
  .done();
```

## 护盾

使用 `.shield` 表明该实体是一个护盾状态，这会添加一个 `.variable("shield", ...)`，并自动添加合适的 `onDamage` 处理函数根据盾量免伤或弃置。

## 持续回合

使用 `.duration` 设置持续回合数。这会添加一个 `.variable("duration", ...)` 并自动在 `onActionPhase` 事件时扣除变量（并在为 0 时弃置）。`.duration` 和 `.variable` 一样必须设置在所有 `.on` 之前。

## 监听范围

几乎所有的事件都只会传播给“局部”的实体；比如对 `onDealDamage` 事件有响应的角色状态，只会在该角色造成伤害时执行。如果希望修改这一行为，使用 `.listenToXxx`：
- 默认情形：只监听实体所在角色或阵营的事件；
- `.listenToPlayer()`：会响应我方阵营的所有同名事件；
- `.listenToAll()`：会响应场上的所有同名事件。

## 召唤物结束阶段操作快捷方法

如果一个召唤物在结束回合造成伤害或治疗，建议使用 `.endPhaseDamage` 快捷方法：

```ts
/** 冰箭丘丘人 */
const CryoHilichurlShooter = summon(303211)
  .endPhaseDamage(DamageType.Cryo, 1)
  .usage(2)
  .done();
```

`.endPhaseDamage` 除了代码量更少外，还额外设置了 `hintText` 属性和 `hintIcon` 变量。`hintText` 是字符串，会展示于召唤物图标左下角；`hintIcon` 则是该字符串的背景图标。在大部分召唤物中，`hintText` 显示结束阶段造成的伤害值，而 `hintIcon` 则是伤害类型。

对于“光降之剑”这种特殊显示则需要手动通过 `.hintText(str)` 和 `.variable("hintIcon", val)` 指明 `hintText` 属性与 `hintIcon` 变量。

`.endPhaseDamage` 还支持传入 `"swirledAnemo"`，即“染色”机制，初始结束阶段伤害为风元素伤害，若我方造成了扩散反应则修改 `hintIcon` 和结束阶段的伤害类型。

## 同名异构实体

很多角色的实体会因为天赋牌存在与否产生差异，如班尼特、可莉、砂糖等。当带有天赋的角色试图产生实体，而场上已经有不带天赋的实体时，虽然两个实体的定义 id 不同，但是仍然新实体会把旧实体“冲掉”。使用 `.conflictWith(id)` 来实现这一行为。该 builder 方法会添加 `.on("enter")` 事件的响应：将场上冲突的实体弃置掉。

```ts
/** 摩耶之殿 */
// 带天赋版：持续回合 3
const ShrineOfMaya01 = combatStatus(117033)
  .conflictWith(117032)
  .duration(3)
  // [...]
  .done();

// 不带天赋版：持续回合 2
const ShrineOfMaya = combatStatus(117032)
  .conflictWith(117033)
  .duration(2)
  // [...]
  .done();
```

## 准备技能

使用 `.prepare` 方法来表示准备技能。`.prepare(Skill)` 的含义是，如果在需要玩家行动的时机，该实体存在，则直接执行 `.useSkill(Skill).dispose()`。

事实上，`.useSkill(Skill).dispose()` 被挂在 `onReplaceAction` 事件上，该事件不会被“引发”，而是在玩家行动前检查，如果存在监听它的技能则直接执行。

> 由于被触发的“准备中”技能使用 `useSkill` 执行，故可以通过 `skillInfo.requestBy.caller` 来获取触发该“准备中”技能的实体状态。

## 关联到扩展点

使用 `.associateExtension` 链方法以允许此实体读写扩展点状态。参见[扩展点](./extensions.md)。
