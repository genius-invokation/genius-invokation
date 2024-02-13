# 日志导入导出

为了方便开发和调试，程序加入了导出游戏日志和导入游戏日志的功能。`@gi-tcg/core` 中，`Game` 的 `gameLog` 属性可以获取当前对局的日志。日志包括所有暂停点的游戏状态和额外引发事件列表。

`serializeGameStateLog` 可将对局日志转换为一个平凡的（可被 JSON 序列化的）对象；`deserializeGameStateLog` 为前者的逆操作。

## 日志序列化实现细节

由于 immutable 的对局记录实现，对局状态中存在大量重复对象，直接导出 JSON 会导致指数级的存储空间膨胀。因此导出的日志结构是如下形式的：

```jsonc
{
  "store": [
    // items...
    { "$$": "cards", "id": 330001 }
  ],
  "log": [
    {
      // s 为对局状态，引用了 store 中的第 123456 项
      "s": { "$": 123456 },
      "e": [ /* 事件列表 */ ],
      "r": true // 是否可暂停
    }
    // next state
  ]
}
```
所有对局状态数据结构都可被视为一个 DAG，其中的复杂节点会被“缓存”在 `store` 里，而每当有若干数据结构引用了相同的节点，就会使用 `{ "$": 节点编号 }` 来指代。此外，带有 `"$$"` 属性和 `"id"` 属性的结构用来替换可从 `data` 中获取的数据结构，它们会在反序列化的时候再获取。

此外，对局状态中的 `mutationLog` 字段会被清空。