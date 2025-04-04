<center>

![logo](./docs/images/logo.png)

</center>

# 七圣召唤模拟器 Genius Invokation TCG Simulator

可访问以下链接试用 There are samples in following links
https://gi-tcg.vercel.app
https://gi-tcg.guyutongxue.site


## 本项目特点 Characteristics of This Project

- 完全开源（主体使用AGPLv3.0或更新版本）Fully open source (main body uses AGPLv3.0 or later)
- 核心实现了目前最接近官方的结算规则 The core implements the closest thing to the official settlement rules currently available
- 截止 ![原神版本](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgi.xqm32.org%2Fapi%2Fversion&query=%24.currentGameVersion&label=%E5%8E%9F%E7%A5%9E) 为止的全部卡牌定义 Full card definitions as of ![Version of Genshin](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgi.xqm32.org%2Fapi%2Fversion&query=%24.currentGameVersion&label=%E5%8E%9F%E7%A5%9E)
  - 定义格式简介明了、清晰易读 Definition format is concise and easy to read
  - 易于维护 Easy maintenance
- 全部旧版本卡牌（平衡性调整前）的定义 Definition of all old version cards (before balance adjustments)
  - 支持自选游戏版本开始对局 Supports self-selected game version to start the game
- 前端功能 Front-end Features：
  - 牌局可视化和本地模拟 Game visualization and local simulation
  - 历史回溯（复盘）和中途继续 Historical retrospective (replay) and mid-game continuation
  - 对局导入导出 Game import and export
  - 查看结算细节日志 View details logs of settlement
- [对战平台 Battle Platform](https://gi.xqm32.org)（公开测试中，感谢 [@xqm32](https://github.com/xqm32) 提供服务器支持 In public beta, thanks to [@xqm32](https://github.com/xqm32) for server support）
- 跨编程语言支持 Cross Programming Language Support
  - [C/C++](./packages/cbinding/)
  - [Python](./packages/pybinding/)
  - [C#](./packages/csbinding/)
  - Coming Soon…
- ~测试服卡牌抢先看 Sneak peeks at the beta cards~~
- 目前**仍有很多 bug**，需要更多测试 Currently **there are still a lot of bugs**, need more testing

## [关于开发 About Development](./docs/development/README.md)

上述链接可查看（可能是过时的）开发文档和注记。The above link provides access to (possibly outdated) development documentation and notes.

<table>
<tbody>
<tr>
<td>

如果有意图参与本项目开发，欢迎加 QQ 群 [693466327](https://qm.qq.com/q/X7XpZg4rW8) 讨论。

</td>
<td>

[![qq_group_qr](./docs/images/qq_group.jpg)](https://qm.qq.com/q/X7XpZg4rW8)

</td>
<tr>
<td colspan="2">

进群口令可在 [`packages/data/src/characters/pyro/amber.ts`](./packages/data/src/characters/pyro/amber.ts) 中找到~

</td>
</tr>
</tbody>
</table>

All English content should refer to the Chinese content.
