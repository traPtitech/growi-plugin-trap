# growi-plugin-trap

GROWI向けのtraP互換スクリプトプラグインです。

## 機能

- Crowiの旧形式のtraQスタンプ記法 `:stamp:` / `:stamp;` と、ユーザーアイコン記法 `:@username:` / `:@username;` を表示します。
- `https://q.trap.jp` から送られる `[URL, height]` メッセージについて、送信元ウィンドウとiframeのURLを照合し、高さが許容範囲内の数値であることを確認してから、traQ Widgetのiframeの高さを調整します。

## 制限事項

スタンプ記法の拡張はページ表示と編集プレビューに適用されます。SSR、リビジョン、コメントには適用されず、保存済みの本文データも書き換えません。

## 開発

```sh
pnpm install
pnpm build
```
