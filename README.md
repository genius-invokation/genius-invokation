# 七圣召唤模拟器·第四版重构计划

## 计划修改
- 使用 Bun 替换 Node.js
- 将实体的事件响应描述和技能描述统一
- 对游戏状态的修改使用统一的 commit 格式
- 继续完成 Web 前端，以及系列交互方式

## 关于代码

- `packages/data-new` 为新版的核心库。数据库合并到了核心库内。
- `packages/standalone-new` 为新版的 Web 前端界面。
- 新版的数据描述方法的文档还没有做

## 关于此项目的重构

- 第一版：使用类与方法装饰器进行数据描述。
- 第二版：改用 builder pattern 数据描述。
- 第三版（当前 archived）：将游戏状态设置为 immutable。
- 第四版（计划）：统一使用实体+技能的方式描述游戏。
