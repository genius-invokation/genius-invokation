# 用户自定义事件

## 定义自定义事件

使用 `customEvent` 函数生成一个自定义事件。

```ts
const myEvent = customEvent("myEvent"); // 名称参数是可选的
```

## 引发自定义事件

用户可在 `SkillContext` 或其声明域中使用 `.emitCustomEvent`：

```ts
// 雷鸣探知
const lightingRod = status(124022)
  // [...]
  .on("damaged")
  .emitCustomEvent(myEvent)     // 声明域引发事件
  .on("selfDispose")
  .do((c) => {
    c.emitCustomEvent(myEvent); // 脚本域引发事件
  })
  .done();
```

## 监听并响应自定义事件

用户可在 `.on` 中直接使用自定义事件以响应。其 `listenTo` 针对引发事件的实体，例如 `.on(myEvent)` 下 `.listenToPlayer()` 只会监听我方实体引发的 `myEvent`。

```ts
// 悲号回唱
const GrievingEcho = card(224021)
  .talent(ThunderManifestation)
  // [...]
  .on(myEvent)
  .listenToAll()    // 监听场上所有实体引发的 myEvent 自定义事件
  .usagePerRound(1)
  .drawCards(1)
  .done();
```

`.on` 对自定义事件也可使用触发条件。

## 引发事件时携带参数

使用 `customEvent` 构造时传入参数类型，并在引发时传入对应的实参。

```ts
const myEventWithArg = customEvent<number>();

const myEntity = status(100001)
  .on("damaged")
  .emitCustomEvent(myEventWithArg, 1)
  .on("selfDispose")
  .emitCustomEvent(myEventWithArg, 2)
  .done();
```

在响应自定义事件时，访问 `e.arg` 获取引发时传入的实参。

```ts
const myReceiver = status(100002)
  .on(myEventWithArg, (c, e) => e.arg === 1)
  .do((c) => {
    // 只会响应 myEntity damaged 引发的 myEventWithArg
    // [...]
  })
  .done();
```
