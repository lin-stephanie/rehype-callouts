import type { Element, Properties } from 'hast'

export type BlockquoteElement = Element & {
  tagName: 'blockquote'
}

/**
 * Create properties for an element within a callout structure,
 * using a `tagName: 'blockquote'` node and the callout type (default or custom).
 */
export type CreateProperties = (
  node: BlockquoteElement,
  type: string
) => Properties | null

export interface CalloutConfig {
  /**
   * The default title for this callout type.
   *
   * For new callout types, if unset or set to an empty string,
   * defaults to the callout type name.
   */
  title?: string

  /**
   * The indicator icon for this callout type, which must be a string in SVG element format.
   *
   * You can view the icon sets used for specific themes on {@link https://icon-sets.iconify.design/ Iconify}:
   * - {@link https://icon-sets.iconify.design/octicon/?keyword=octicon Octicons} icon set for GitHub
   * - {@link https://icon-sets.iconify.design/lucide/?keyword=luci Lucide} icon set for Obsidian, VitePress
   *
   * For new callout types, if unset, this callout type will not display an indicator,
   * even if {@link RehypeCalloutsOptions.showIndicator} is true.
   *
   * @example
   * '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 6L9 17l-5-5"/></svg>'
   *
   */
  indicator?: string
}

export interface Tags {
  /**
   * Tag name for the outer container of **non-collapsible** callouts.
   *
   * For **collapsible** callouts, the tag name is fixed to 'details'
   * for collapsibility and is not configurable.
   * However, you can consider setting {@link contentTagName}
   * to achieve the same semantic markup effect.
   *
   * @default
   * 'div'
   *
   * @example
   * 'blockquote' - For semantic HTML.
   */
  nonCollapsibleContainerTagName?: string

  /**
   * Tag name for the title container of **non-collapsible** callouts.
   *
   * For **collapsible** callouts, the tag name is fixed to 'summary'
   * for collapsibility and is not configurable.
   *
   * @default
   * 'div'
   */
  nonCollapsibleTitleTagName?: string

  /**
   * Tag name for the content container in both **collapsible and non-collapsible** callouts.
   *
   * @default
   * 'div'
   */
  contentTagName?: string

  /**
   * Tag name for the title icon container in both **collapsible and non-collapsible** callouts.
   *
   * @default
   * 'div'
   */
  titleIconTagName?: string

  /**
   * Tag name for the title text container in both **collapsible and non-collapsible** callouts.
   *
   * @default
   * 'div'
   */
  titleTextTagName?: string

  /**
   * Tag name for the fold icon container in **collapsible** callouts.
   *
   * @default
   * 'div'
   */
  foldIconTagName?: string
}

export interface Props {
  /**
   * Properties for the outer container element in both **collapsible and non-collapsible** callouts.
   *
   * For collapsible callouts, the outer container element is always fixed as `<details>`.
   */
  containerProps?: CreateProperties | Properties | null

  /**
   * Properties for the title container element in both **collapsible and non-collapsible** callouts.
   *
   * For collapsible callouts, the outer container element is always fixed as `<summary>`.
   */
  titleProps?: CreateProperties | Properties | null

  /**
   * Properties for the content container element in both **collapsible and non-collapsible** callouts.
   */
  contentProps?: CreateProperties | Properties | null

  /**
   * Properties for the title icon container element in both **collapsible and non-collapsible** callouts.
   */
  titleIconProps?: CreateProperties | Properties | null

  /**
   * Properties for the title text container element in both **collapsible and non-collapsible** callouts.
   */
  titleTextProps?: CreateProperties | Properties | null

  /**
   * Properties for the fold icon container element in **collapsible** callouts.
   */
  foldIconProps?: CreateProperties | Properties | null
}

export interface RehypeCalloutsOptions<Callouts, Tags, Props> {
  /**
   * Specifies your desired callout theme to automatically apply its default types.
   *
   * Refer to the {@link https://github.com/lin-stephanie/rehype-callouts/tree/main/src/themes theme's source code} f
   * or more details. Available themes:
   * {@link https://github.com/orgs/community/discussions/16925 GitHub},
   * {@link https://help.obsidian.md/Editing+and+formatting/Callouts Obsidian},
   * {@link https://vitepress.dev/guide/markdown#github-flavored-alerts VitePress}.
   *
   * @default 'obsidian'
   */
  theme?: 'github' | 'obsidian' | 'vitepress'

  /**
   * Defines the properties for default and custom callouts.
   *
   * This object maps callout types to their properties.
   * Each key represents a callout type, which can be either the default or newly defined,
   * and the value is an object that specifies its properties.
   *
   * Key are case-insensitive, i.e., 'Note', 'NOTE' are equivalent to 'note'.
   *
   * @example
   * {
   *   "type": {
   *     title: 'Type',
   *     indicator: '<svg ...>...</svg>',
   *   },
   *   ...
   * }
   */
  callouts?: Record<string, Callouts>

  /**
   * Configures aliases for callout types.
   *
   * It is an object containing the callout definitions,
   * the key designates an existing or new callout type, and the value configures its properties.
   *
   * Key are case-insensitive, i.e., 'Note', 'NOTE' are equivalent to 'note'.
   *
   * @example
   * {
   *  'note': ['no', 'n'],
   *  'tip': ['t'],
   * }
   */
  aliases?: Record<string, string[]>

  /**
   * Whether to display an type-specific icons before callout title.
   *
   * Since the {@link https://vitepress.dev/guide/markdown#github-flavored-alerts VitePress} theme
   * lacks default indicator icons, setting this option to `true` will apply GitHub style icons.
   *
   * @default true
   */
  showIndicator?: boolean

  /**
   * Configures HTML tag names for elements within the callout structure for semantic flexibility.
   */
  tags?: Tags

  /**
   * Configures properties for elements within the callout structure.
   *
   * Setting `class` or `className` overrides the default class names for generated elements.
   */
  props?: Props
}

export type Callouts = Record<string, CalloutConfig>
export type DefaultCallouts = Record<string, Required<CalloutConfig>>
export type UserOptions = RehypeCalloutsOptions<CalloutConfig, Tags, Props>
export type ConfigOptions = Required<
  RehypeCalloutsOptions<CalloutConfig, Required<Tags>, Required<Props>>
>
