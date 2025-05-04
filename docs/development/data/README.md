# 卡牌数据定义

官方卡牌数据均定义于 `@gi-tcg/data` 包；但是定义的方法来自于 `@gi-tcg/core` 的 `builder` 子导出。目前的定义方法是：

```ts
import { Registry } from "@gi-tcg/core/builder";

const registry = new Registry();
const scope = registry.begin();

// 所有的数据定义于此

scope.end();
export const dataGetter =
  (version: Version) => registry.resolve(/* version-resolvers */);
```

`@gi-tcg/data` 在全局作用域中给出官方卡牌的数据定义，通过有序的 `import` 插入到 `scope` 指定的注册范围内，最后导出获取数据的 `DataGetter`。

## 注册方法

调用 `scope.begin()` 后，全局调用 `character(...)`、`card(...)` 等方法将提供卡牌定义注入到该 `scope` 的 `Registry` 中。这些方法包括：
- `character` 定义角色牌
- `card` 定义行动牌
- `skill` 定义角色技能
- `status` 定义角色状态
- `combatStatus` 定义出战状态
- `summon` 定义召唤物

> 此外 `equipment` 定义角色装备和 `support` 定义支援区实体，它们不应被直接使用而是在 `card` 的后续链方法中给出。

这些方法是 builder chain——在随后通过 `.foo(...).bar(...)` 的形式给出更进一步的定义，并最终用 `.done();` 结束链，完成定义。一个简单的例子如下：

```ts
/** 运筹帷幄 */
const Strategize = card(332004) // 给出行动牌 id
  .costSame(1)                  // 消耗 1 个同色骰子
  .drawCards(2)                 // 效果：抽两张牌
  .done();                      // 结束定义
```

角色牌、行动牌、实体、技能的 id 应当和官方数据 id 保持一致。如果技术限制无法做到，可以使用小数作为 id，只需确保 `Math.floor(id)` 等于官方数据 id。

`.done()` 会返回 `id` 本身，但是在本文档里称其为“句柄”，并在 TypeScript 中约束为特别的具名类型（如 `character` 的 `.done()` 返回 `CharacterHandle`，而 `.talent` 等方法只接受 `CharacterHandle` 而非 `number`）。如果一个方法期望句柄，但是你只持有 `number` 类型的 `id`（比如是来自[对局状态结构](../state.md)的数据），那么你需要一个 `as` 显式转换，即你自己保证这个 `id` 存在一个合法的定义。

具体每种数据的定义方式参考一下条目：
- [角色牌与角色技能](./character.md)
- [行动牌](./card.md)
- [状态、出战状态和召唤物](./entity.md)

## 官方卡牌数据自动化维护

`@gi-tcg/data` 的数据维护工作基于自动化工作流，参考 [generator](./generator.md)。

## 版本解析

允许在注册范围内注册相同 id 的定义，以表示该 id 的不同版本。版本信息是指一个命名空间外加该命名空间下的版本类型，对于官方版本命名空间 `official` 而言是

```ts
interface OfficialVersionInfo {
  predicate: "since" | "until";
  version: Version;
}
```

未来将支持自定义卡、实体牌等不同命名空间。所有命名空间的版本类型通过 `@gi-tcg/core` 的 `GiTcg.VersionMetadata` 接口给出，如支持自定义卡版本信息：

```ts
declare module "@gi-tcg/core" {
  namespace GiTcg {
    interface VersionMetadata {
      official: OfficialVersionInfo;
      customData: { /* 自定义卡的版本信息类型结构 */ }
    }
  }
}
```

在卡牌定义代码中使用 `setVersionInfo` 设置版本信息。该链方法会读取所有 `GiTcg.VersionMetadata` 中定义的键为命名空间，值为该命名空间的版本信息参数类型，如：

```ts
const MyCustomCard = card(1000000)
  .setVersionInfo("customData", { /* 自定义卡的版本信息 */ })
  // [...]
```

对于官方版本而言使用 `.since` 和 `.until` 等价于 `.setVersionInfo("official", { ... })`，具体用法可参考 [游戏版本](./version.md)。

为了选中某个 id 的确切版本，需要调用 `registry.resolve` 并传入版本解析函数。对于维护官方数据的 `@gi-tcg/data` 而言，它直接传入了 `@gi-tcg/core` 定义的 `resolveOfficialVersion`，其解析流程在 [游戏版本](./version.md) 中描述。版本解析函数的调用签名是：

```ts
type Entry = { id: number, versionInfo: { from: string, value: unknown } };
type VersionResolver = <T extends Entry>(items: T[]) => T | null;

interface Registry {
  resolve(...resolvers: VersionResolver[]): GameData;
}
```

其中 `Entry` 的 `versionInfo` 给出该版本的命名空间和版本信息（从 `setVersionInfo` 传入），`VersionResolver` 负责筛选出其中一个；它也可以不做任何筛选（返回 `null`），此时由下一个版本解析函数处理它们。如果所有版本解析函数都不处理这一 id，那么最终 `registry.resolve` 得到的数据将不包含它。
