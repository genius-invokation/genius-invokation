<center>

![ロゴ](./docs/images/logo.png)

</center>

[中文版](./README.md) [English Version](./README.en.md)

#　シチセイショウカンシミュレーター

https://gi-tcg.vercel.app または https://gi-tcg.guyutongxue.site でお試しください。

## このプロジェクトの特徴

- 完全なオープンソース(本体はAGPLv3.0以降を使用)
- コアは現時点で最も公式決済ルールに近いものを実装している
- [原神バージョン](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgi.xqm32.org%2Fapi%2Fversion&query=%24.currentGameVersion&label=%e5%8e%9f%e7%a5%9e)時点での全カード定義
  - 定義形式が明確で見やすい。
  - メンテナンスしやすい
- 全ての旧カード(バランス調整前)の定義。
  - 自分でゲームバージョンを選択してゲームを開始することに対応
- フロントエンド機能：
  - 手札の視覚化とローカルシミュレーション
  - 履歴(リプレイ)と途中継続。
  - ゲームのインポートとエクスポート
  - 決済詳細ログの表示
- [マッチメイキング・プラットフォーム](https://gi.xqm32.org) (パブリックベータ中[@xqm32](https://github.com/xqm32) のサーバーサポートに感謝)
- クロスプログラミング言語サポート
  - [C/C++](./packages/cbinding/)
  - [Python](./packages/pybinding/)
  - [C#](./packages/csbinding/)
  - その他のプログラミング言語にもご期待ください。
- ベータ版のデッキを覗いてみよう。
- 現在、**まだ多くのバグ**があり、より多くのテストが必要です！

## [開発について](./docs/development/README.md)

上記のリンクから、（古いかもしれませんが）開発ドキュメントとノートを見ることができます。


すべての内容は中国語版をご参照ください。