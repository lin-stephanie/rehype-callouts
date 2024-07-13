/**
 * Defines configuration properties for each type of callout.
 */
export interface CalloutConfig {
  /**
   * Set the default title for this callout type.
   *
   * @description
   * For newly added callout types, if unset or set to an empty string,
   * defaults to the callout type name.
   *
   */
  title: string

  /**
   * Set the indicator icon for this callout type, which must be a string in SVG element format.
   *
   * @description
   * For newly added callout types, if unset, this callout type will not display an indicator,
   * even if {@link RehypeCalloutsOptions.showIndicator} is true.
   *
   * @example
   */
  indicator: string

  /**
   * Set the color(s) for this callout type, which must be a
   * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#syntax `<color>`} type string.
   *
   * @description
   * For newly added callout types, if unset, the default color will be `#888`.
   *
   * @example
   * '#0969da': Suitable for both light and dark themes.
   * ['#0969da', '#2f81f7']: First color for light theme, second for dark theme.
   *
   */
  color: string | [string, string]
}

/**
 * Options for the `rehype-callouts` plugin.
 */
export interface RehypeCalloutsOptions {
  /**
   * Specifies the style for callouts. Available themes:
   * {@link https://github.com/orgs/community/discussions/16925 Github},
   * {@link https://help.obsidian.md/Editing+and+formatting/Callouts Obsidian},
   * {@link https://docusaurus.io/docs/markdown-features/admonitions Docusaurus},
   * {@link https://vitepress.dev/guide/markdown#github-flavored-alerts Vitepress}.
   *
   * @default "github"
   */
  theme: 'github' | 'obsidian' | 'vitepress' | 'docusaurus'

  /**
   * Configures existing callout types or sets up new callout types.
   *
   * @description
   * It is an object containing the callout definitions,
   * the key designates an existing or new callout type, and the value configures its properties.
   *
   */
  callouts: Record<string, CalloutConfig>

  /**
   * Configures aliases for callouts.
   *
   * @description
   * It is an object containing the callout definitions,
   * the key designates an existing or new callout type, and the value configures its properties.
   *
   */
  aliases: Record<string, string[]>

  /**
   * Whether to display an type-specific indicator icons before callout titles.
   *
   * @default true
   */
  showIndicator: boolean

  /**
   * Set the prefix for the class names.
   *
   * @remarks
   * Since the {@link https://vitepress.dev/guide/markdown#github-flavored-alerts Vitepress} theme
   * lacks default indicator icons, setting this option to `true` will apply
   * {@link https://help.obsidian.md/Editing+and+formatting/Callouts Obsidian} style icons.
   *
   * @default "rehype-callouts"
   */
  classPrefix: string
}
