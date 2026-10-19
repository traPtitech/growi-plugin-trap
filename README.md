# growi-plugin-trap

traP compatibility Script Plugin for GROWI.

## Features

- Renders old Crowi traQ stamp syntax `:stamp:` / `:stamp;` and user icons `:@username:` / `:@username;`.
- Converts Crowi page links `[/path]` and `<//path>` in page and preview Markdown.
- Renders `:::success` containers in the existing green `tip` callout style.
- Resizes traQ Widget iframes from the `[URL, height]` messages sent by `https://q.trap.jp`, after matching the sending window and iframe URL and validating a bounded numeric height.
- Leaves page and revision Markdown data unchanged.

## Limitations

GROWI's Script Plugin API exposes client-side page and preview Markdown options only. It does not provide a shared extension registration point for SSR, revision, or comment renderers. This plugin does not rewrite stored page or revision data.

## Development

```sh
pnpm install
pnpm build
```
