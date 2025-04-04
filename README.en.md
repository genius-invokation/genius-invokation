# Genius Invokation TCG Simulator

[中文版](./README.md)  | [English Version](./README.en.md) | [日本語版](./README.jp.md)

Sample deployments are available at following links:
https://gi-tcg.vercel.app
https://gi-tcg.guyutongxue.site


## Features of This Project

- Fully open source (main body uses AGPLv3.0 or later)
- The core implementations try to be the closest to the official rules
- Full card definitions as of ![Version of Genshin Impact](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgi.xqm32.org%2Fapi%2Fversion&query=%24.currentGameVersion&label=%E5%8E%9F%E7%A5%9E)
  - Definition format is concise and easy to read
  - Easy maintenance
- Definition of all old version cards (before balance adjustments)
  - Supports self-selected game version to start the game
- Front-end Features：
  - Game visualization and local simulation
  - Historical retrospective (replay) and mid-game continuation
  - Game import and export
  - View details logs of settlement
- [Battle Platform (Chinese Version only)](https://gi.xqm32.org)In public beta, thanks to [@xqm32](https://github.com/xqm32) for server support）
- Cross Programming Language Support
  - [C/C++](./packages/cbinding/)
  - [Python](./packages/pybinding/)
  - [C#](./packages/csbinding/)
  - Coming Soon...
- ~Sneak peeks at the beta cards~
- Currently **there are still a lot of bugs**, need more testing

## [About Development](./docs/development/README.md)

The above link provides access to (possibly outdated) development documentation and notes.

All English content should refer to the Chinese content.
