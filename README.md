# growi-plugin-trap

GROWI向けのtraP互換スクリプトプラグインです。

## 機能

- Crowiの旧形式のtraQスタンプ記法 `:stamp:` / `:stamp;` と、ユーザーアイコン記法 `:@username:` / `:@username;` を表示します。
- ページとプレビューのMarkdown内にあるCrowiのページリンク `[/path]` と `<//path>` を変換します。
- `:::success` コンテナを、既存の緑色の `tip` コールアウトと同じ形式で表示します。
- `https://q.trap.jp` から送られる `[URL, height]` メッセージについて、送信元ウィンドウとiframeのURLを照合し、高さが許容範囲内の数値であることを確認してから、traQ Widgetのiframeの高さを調整します。
- ページとリビジョンのMarkdownデータは変更しません。

## 制限事項

GROWIのScript Plugin APIで指定できるのは、ページとプレビューのMarkdownに対するクライアント側の処理だけです。SSR、リビジョン、コメントの各レンダラーに共通の拡張登録ポイントはありません。このプラグインは保存済みのページやリビジョンのデータを書き換えません。

## 開発

```sh
pnpm install
pnpm build
```
