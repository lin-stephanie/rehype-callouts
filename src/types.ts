/**
 * Defines configuration properties for each type of callout.
 */
interface CalloutConfig {
  /**
   * The default title for this callout type.
   *
   * @description
   * For newly added callout types, if unset or set to an empty string,
   * defaults to the callout type name.
   */
  title?: string

  /**
   * The indicator icon for this callout type, which must be a string in SVG element format.
   *
   * @description
   * You can view the icon sets used for specific themes on {@link https://icon-sets.iconify.design/ Iconify}:
   * - {@link https://icon-sets.iconify.design/octicon/?keyword=octicon Octicons} icon set for GitHub
   * - {@link https://icon-sets.iconify.design/lucide/?keyword=luci Lucide} icon set for Obsidian
   *
   * For newly added callout types, if unset, this callout type will not display an indicator,
   * even if {@link RehypeCalloutsOptions.showIndicator} is true.
   *
   * @example
   * '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 6L9 17l-5-5"/></svg>'
   *
   */
  indicator?: string

  /**
   * The color(s) for this callout type, which must be a
   * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#syntax `<color>`} type string.
   *
   * @description
   * For newly added callout types, if unset, the default color will be `#888`.
   *
   * @example
   * '#0969da': Suitable for both light and dark themes.
   * ['#0969da', '#2f81f7']: First color for light theme, second for dark theme.
   */
  color?: string | [string, string]
}

/**
 * Options for the `rehype-callouts` plugin.
 */
interface RehypeCalloutsOptions<T> {
  /**
   * Specifies the style for callouts. Available themes:
   * {@link https://github.com/orgs/community/discussions/16925 Github},
   * {@link https://help.obsidian.md/Editing+and+formatting/Callouts Obsidian},
   * {@link https://docusaurus.io/docs/markdown-features/admonitions Docusaurus},
   * {@link https://vitepress.dev/guide/markdown#github-flavored-alerts Vitepress}.
   *
   * @default 'github'
   */
  theme?: 'github' | 'obsidian' | 'vitepress' | 'docusaurus'

  /**
   * Configures or defines callout types.
   *
   * @description
   * This object maps callout types to their properties.
   * Each key represents a callout type, which can be either predefined or newly defined,
   * and the value is an object that specifies its properties.
   *
   * @example
   * {
   *   "customCalloutType": {
   *     title: 'customCalloutTitle',
   *     indicator: '<svg ...>...</svg>',
   *     color: ['#0969da', '#2f81f7']
   *   },
   *   ...
   * }
   */
  callouts?: Record<string, T>

  /**
   * Configures aliases for callouts.
   *
   * @description
   * It is an object containing the callout definitions,
   * the key designates an existing or new callout type, and the value configures its properties.
   *
   * @example
   * {
   *  'note': ['no', 'n'],
   *  'tip': ['t'],
   * }
   */
  aliases?: Record<string, string[]>

  /**
   * Whether to display an type-specific indicator icons before callout titles.
   *
   * @remarks
   * Since the {@link https://vitepress.dev/guide/markdown#github-flavored-alerts Vitepress} theme
   * lacks default indicator icons, setting this option to `true` will apply
   * {@link https://help.obsidian.md/Editing+and+formatting/Callouts Obsidian} style icons.
   *
   * @default true
   */
  showIndicator?: boolean
}

export type Callouts = Record<string, CalloutConfig>
export type DefaultCallouts = Record<string, Required<CalloutConfig>>
export type UserOptions = RehypeCalloutsOptions<CalloutConfig>
export type ConfigOptions = Required<RehypeCalloutsOptions<CalloutConfig>>
