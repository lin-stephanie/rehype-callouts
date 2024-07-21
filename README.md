# rehype-callouts

[![Coverage][coverage-badge]][coverage]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![JSDocs][jsdocs-src]][jsdocs-href]

A [rehype](https://github.com/rehypejs/rehype) plugin for processing and rendering blockquote-based callouts.

## What is this?

This package is a [unified](https://github.com/unifiedjs/unified) ([rehype](https://github.com/rehypejs/rehype)) plugin to add support for callouts (admonitions/alerts).
This lets you to uniformly use [Obsidian's callout syntax](https://help.obsidian.md/Editing+and+formatting/Callouts) in markdown to achieve the following features:

- Comes with default callouts types.
- Supports custom titles (using markdown syntax).
- Supports collapsible and nestable callouts.
- Supports modifying default callouts (title, icon, color).
- Configurable [themes](#themes) for applying default callout types and styles.
- Configurable new types of callouts.
- Configurable aliases for callout types.
- Configurable icon display.

## When should I use this?

This plugin is useful when you need to write callouts in markdown and render them effectively, such as displaying callouts written in Obsidian on a blog website created with the Astro framework.

Additionally, this plugin modifies HTML directly (no `allowDangerousHtml` needed in [remark-rehype](https://github.com/remarkjs/remark-rehype)), and manages collapsible callouts using the details tag without requiring JavaScript.

## Installation

This package is [ESM only](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c). In Node.js (version 16+), install with your package manager:

```sh
npm install rehype-callouts
yarn add rehype-callouts
pnpm add rehype-callouts
```

In Deno with [`esm.sh`](https://esm.sh/):

```js
import rehypeCallouts from 'https://esm.sh/rehype-callouts'
```

In browsers with [`esm.sh`](https://esm.sh/):

```html
<script type="module">
  import rehypeCallouts from 'https://esm.sh/rehype-callouts?bundle'
</script>
```

## Usage

Say `example.md` contains:

```md
> [!note] This is a _non-collapsible_ callout
> Some content is displayed directly!

> [!WARNING]- This is a **collapsible** callout
> Some content shown after opening!
```

And module `example.js` contains:

```js
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeCallouts from 'rehype-callouts'
import rehypeStringify from 'rehype-stringify'
import { readSync } from 'to-vfile'

const file = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeCallouts)
  .use(rehypeStringify)
  .processSync(readSync('example.md'))

console.log(String(file))
```

Or for an Astro project, the `astro.config.ts` contains:

```ts
import { defineConfig } from 'astro/config'
import rehypeCallouts from 'rehype-callouts'

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  // ...
  markdown: {
    // ...
    rehypePlugins: [
      // ...
      rehypeCallouts,
    ],
  },
  // ...
})
```

Then running `node example.js` or `pnpm astro dev` yields:

```html
<div
  class="callout"
  style="--callout-color-light: rgb(8, 109, 221); --callout-color-dark: rgb(2, 122, 255);"
>
  <div class="callout-title">
    <div class="callout-icon">
      <!-- svg icon-->
    </div>
    <div class="callout-title-inner">
      This is a <em>non-collapsible</em> callout
    </div>
  </div>
  <div class="callout-content">
    <p>Some content is displayed directly!</p>
  </div>
</div>

<details
  class="callout callout-collapsible"
  style="--callout-color-light: rgb(236, 117, 0); --callout-color-dark: rgb(233, 151, 63);"
>
  <summary class="callout-title">
    <div class="callout-icon">
      <!-- svg icon-->
    </div>
    <div class="callout-title-inner">
      This is a <strong>collapsible</strong> callout
    </div>
    <div class="callout-fold">
      <!-- svg icon-->
    </div>
  </summary>
  <div class="callout-content">
    <p>Some content shown after opening!</p>
  </div>
</details>
```

### Styling

You can customize the callout styles based on the class names (as shown above) or import the stylesheets for different [themes](#themes) provided by the package:

```ts
import 'rehype-callouts/theme/github'
import 'rehype-callouts/theme/obsidian'
import 'rehype-callouts/theme/vitepress'
// or using URL import
import 'https://unpkg.com/rehype-callouts/themes/github/index.css'
```

If bundling CSS files, import the CSS in your main CSS file:

```css
@import 'rehype-callouts/theme/github';
```

For Sass, import the CSS in your main Sass file:

```scss
@use 'rehype-callouts/theme/github';
```

Alternatively, import the CSS directly in browsers via [unpkg.com](https://unpkg.com) or [jsdelivr.net](https://www.jsdelivr.com/):

```html
<link
  rel="stylesheet"
  href="https://unpkg.com/rehype-callouts/dist/themes/github/index.css"
/>
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/rehype-callouts/dist/themes/github/index.css"
/>
```

## API

This package exports no identifiers. The default export is `rehypeCallouts`.

### `unified().use(rehypeCallouts, options?)`

Used to process and render callouts, including an optional parameter [`options`](#options).

### `options: UserOptions`

Configure the behavior of this plugin using the following options. All of these options are optional:

| Option                                           | Type                                                                                                                                 | Description                                                                                                                        |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| theme                                            | `'github'\|'obsidian'\|'vitepress'`<br>(default: `obsidian`)                                                                         | Specify your desired callout theme to automatically apply its default callout types.                                               |
| [callouts](#callouts-recordstring-calloutconfig) | `Record<string, CalloutConfig>` (default: see [source code](https://github.com/lin-stephanie/rehype-callouts/tree/main/src/themes) ) | Defines the properties for default and custom callouts. For example: `{'note': {title: 'CustomTitle'}, 'custom': {color: 'pink'}}` |
| aliases                                          | `Record<string, string[]>` (default: `{}`)                                                                                           | Configure aliases for callout types. For example: `{'note': ['n'], 'tip': ['t']}`                                                  |
| showIndicator                                    | `boolean`(default: `true`)                                                                                                           | Whether to display an type-specific icons before callout title.                                                                    |

### `callouts: Record<string, CalloutConfig>`

Defines the properties for default and custom callouts. Each key represents a callout type, and the value is an object with the following optional properties:

| Property  | Type                         | Description                                                                                                                                                                                                                                                                                                        |
| --------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| title     | `string`                     | Title for this callout type. For new callout types, defaults to the callout type name if unset.                                                                                                                                                                                                                    |
| indicator | `string`                     | Icon in SVG format as a string. For new callout types, the icon will not display unless set, even if `showIndicator` is `true`. You can get icons from [Iconify](https://icon-sets.iconify.design/). For example: `'<svg>...</svg>'`                                                                               |
| color     | `string \| [string, string]` | Color(s) as a [`<color>`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#syntax) string. For new callout types, defaults to `#888` if unset. For example:<br>`'rgb(8, 109, 221)'`: works for both light and dark themes.<br>`['#0969da', '#2f81f7']` : first for light theme, second for dark theme. |

## Themes

This package also provides callout styles for [GitHub](https://github.com/orgs/community/discussions/16925), [Obsidian](https://help.obsidian.md/Editing+and+formatting/Callouts), and [VitePress](https://vitepress.dev/guide/markdown#github-flavored-alerts) themes. These stylesheets implement dark mode using the `.dark` class. See the [source code](https://github.com/lin-stephanie/rehype-callouts/tree/main/src/themes) for more details.

### GitHub

![github](https://github.com/lin-stephanie/rehype-callouts/blob/main/docs/github.png)

### Obsidian

![obsidian](https://github.com/lin-stephanie/rehype-callouts/blob/main/docs/obsidian.png)

### VitePress

![vitepree](https://github.com/lin-stephanie/rehype-callouts/blob/main/docs/vitepress.png)

## Types

This package is fully typed with [TypeScript](https://www.typescriptlang.org/). See [jsDocs.io](https://www.jsdocs.io/package/rehype-callouts) for type details.

## Credits

- [staticnoise/rehype-obsidian-callout](https://gitlab.com/staticnoise/rehype-obsidian-callout) - basic functionality.
- [Octions](https://primer.style/foundations/icons/) - default icons for GitHub callouts.
- [Lucide](https://lucide.dev/) - default icons for Obsidian, VitePress callouts.

## Contribution

If you see any errors or room for improvement on this plugin, feel free to open an [issues](https://github.com/lin-stephanie/rehype-callouts/issues) or [pull request](https://github.com/lin-stephanie/rehype-callouts/pulls) . Thank you in advance for contributing!

## License

[MIT](https://github.com/lin-stephanie/rehype-callouts/blob/main/LICENSE) © 2024-PRESENT [Stephanie Lin](https://github.com/lin-stephanie)

<!-- Badges -->

[coverage-badge]: https://img.shields.io/codecov/c/github/lin-stephanie/rehype-callouts?style=flat&colorA=080f12&colorB=ef7575
[coverage]: https://codecov.io/github/lin-stephanie/rehype-callouts
[npm-downloads-src]: https://img.shields.io/npm/dm/rehype-callouts?style=flat&colorA=080f12&colorB=ef7575
[npm-downloads-href]: https://npmjs.com/package/rehype-callouts
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=ef7575
[jsdocs-href]: https://www.jsdocs.io/package/rehype-callouts
