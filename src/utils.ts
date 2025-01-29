import { fromHtml } from 'hast-util-from-html'
import { h } from 'hastscript'

import { githubCallouts } from './themes/github/config.js'
import { obsidianCallouts } from './themes/obsidian/config.js'
import { vitepressCallouts } from './themes/vitepress/config.js'

import type { ElementContent, Element, Text, Properties } from 'hast'
import type {
  BlockquoteElement,
  CreateProperties,
  UserOptions,
  RequiredOptions,
  Callouts,
} from './types.js'

export const calloutRegex =
  /\[!(?<type>\w+)](?<collapsable>[+-]?)\s*(?<title>.*)/g

export const splitByNewlineRegex = /(?<prefix>[^\n]*)\n(?<suffix>[\S\s]*)/g

export const themes = {
  github: githubCallouts,
  obsidian: obsidianCallouts,
  vitepress: vitepressCallouts,
}

export const defaultClassNames = {
  container: 'callout',
  title: 'callout-title',
  content: 'callout-content',
  titleIcon: 'callout-title-icon',
  foldIcon: 'callout-fold-icon',
  titleText: 'callout-title-text',
}

/**
 * Call a function to get a return value or use the value.
 */
export function createIfNeeded(
  value: CreateProperties | Properties | null,
  node: BlockquoteElement,
  type: string
) {
  return typeof value === 'function' ? value(node, type) : value
}

/**
 * Converts aproperty keys of the object to lowercase.
 */
function convertKeysToLowercase<T>(
  object: Record<string, T>
): Record<string, T> {
  const newObject: Record<string, T> = {}
  for (const key of Object.keys(object)) {
    newObject[key.toLowerCase()] = object[key]
  }

  return newObject
}

/**
 * Constructs the configuration.
 */
export function getConfig(
  userOptions: UserOptions | undefined
): RequiredOptions {
  const defaultOptions: RequiredOptions = {
    theme: 'obsidian',
    callouts: themes.obsidian,
    aliases: {},
    showIndicator: true,
    tags: {
      nonCollapsibleContainerTagName: 'div',
      nonCollapsibleTitleTagName: 'div',
      contentTagName: 'div',
      titleIconTagName: 'div',
      titleTextTagName: 'div',
      foldIconTagName: 'div',
    },
    props: {
      containerProps: null,
      titleProps: null,
      contentProps: null,
      titleIconProps: null,
      titleTextProps: null,
      foldIconProps: null,
    },
  }

  if (userOptions) {
    const { theme, callouts, aliases } = userOptions
    if (callouts) userOptions.callouts = convertKeysToLowercase(callouts)
    if (aliases) userOptions.aliases = convertKeysToLowercase(aliases)

    const initCallouts = theme ? themes[theme] : themes.obsidian
    const mergedCallouts = { ...initCallouts }
    if (userOptions.callouts) {
      for (const key of Object.keys(userOptions.callouts)) {
        mergedCallouts[key] = {
          ...initCallouts[key],
          ...userOptions.callouts[key],
        }
      }
    }

    return {
      theme: userOptions.theme ?? defaultOptions.theme,
      callouts: mergedCallouts,
      aliases: { ...defaultOptions.aliases, ...userOptions.aliases },
      showIndicator: userOptions.showIndicator ?? defaultOptions.showIndicator,
      tags: {
        ...defaultOptions.tags,
        ...userOptions.tags,
      },
      props: {
        ...defaultOptions.props,
        ...userOptions.props,
      },
    }
  }

  return defaultOptions
}

/**
 * Expands the original callouts object based on aliases.
 */
export function expandCallouts(
  callouts: Callouts,
  aliases: Record<string, string[]>
): Record<string, string> {
  if (Object.keys(aliases).length === 0) return {}

  const expandedCallouts = structuredClone(callouts)
  const aliasMap: Record<string, string> = {}

  for (const [key, aliasList] of Object.entries(aliases)) {
    const lowerKey = key.toLowerCase()
    const originalCallout = expandedCallouts[lowerKey]

    if (originalCallout) {
      const processedAliases = new Set<string>()
      for (const alias of aliasList) {
        const lowerAlias = alias.toLowerCase()
        if (!processedAliases.has(lowerAlias)) {
          aliasMap[lowerAlias] = lowerKey
          processedAliases.add(lowerAlias)
        }
      }
    }
  }

  return aliasMap
}

/**
 * Cleanup due to double spaces after title in Markdown being
 * converted to <br> tags.
 */
export function handleBrAfterTitle(
  children: ElementContent[]
): ElementContent[] {
  return children.filter((child) => {
    if (child.type === 'element' && child.tagName === 'br') {
      return false
    }

    return true
  })
}

/**
 * Finds the index of the first text node containing a newline.
 */
export function findFirstNewline(children: ElementContent[]): number {
  for (const [i, c] of children.entries()) {
    if (c.type === 'text' && c.value.includes('\n')) {
      return i
    }
  }

  return -1
}

/**
 * Checks if a node is a text node.
 */
function isText(node: ElementContent): node is Text {
  return node.type === 'text'
}

/**
 * Merges consecutive text nodes in a HAST children array
 * until the first non-text node is encountered.
 *
 * In Svelte, the AST will be:
 * ```
 * children: [
 *   { type: 'text', value: '[!note]', position: [Object] },
 *   { type: 'text', value: '- xxx', position: [Object] },
 * ]
 * ```
 * instead of:
 * ```
 * children: [
 *   { type: 'text', value: '[!note]- xxx', position: [Object] }
 * ]
 * ```
 * when markdown is: `![note]- xxx`
 */
export function mergeConsecutiveTextNodes(children: ElementContent[]) {
  const firstNonTextIndex = children.findIndex((node) => !isText(node))

  // case 1: if all nodes are text
  if (firstNonTextIndex === -1) {
    if (children.length > 1) {
      const mergedValue = (children as Text[])
        .map((n) => n.value || '')
        .join('')

      const firstTextNode = children[0] as Text
      firstTextNode.value = mergedValue
      delete firstTextNode.position

      children.splice(1)
    }

    return
  }

  // case 2: if there are non-text nodes,
  // only consider the text nodes before the first non-text node
  if (firstNonTextIndex > 1) {
    let mergedValue = ''
    for (let i = 0; i < firstNonTextIndex; i++) {
      const node = children[i]
      if (isText(node)) {
        mergedValue += node.value
      }
    }

    const firstTextNode = children[0] as Text
    firstTextNode.value = mergedValue
    delete firstTextNode.position

    children.splice(1, firstNonTextIndex - 1)
  }

  // case 3: if the first non-text node is preceded
  // by only one text node or no text node, no need to merge
}

/**
 * Merges user-defined `class` or `className` fields
 * with a default class name, returning a new properties object.
 */
export function getProperties(
  props: Properties | null,
  defaultClassName: string
): Properties {
  const newProps: Properties = props ? { ...props } : {}
  const classes = new Set<string>()

  const addClasses = (
    value: string | number | boolean | Array<string | number>
  ) => {
    if (typeof value === 'string') {
      for (const c of value.split(/\s+/)) {
        if (c) classes.add(c)
      }
    } else if (Array.isArray(value)) {
      for (const c of value) {
        if (typeof c === 'string' && c) {
          classes.add(c)
        }
      }
    }
  }

  if (!newProps.class && !newProps.className) {
    classes.add(defaultClassName)
  }

  if (newProps.class !== undefined && newProps.class !== null) {
    addClasses(newProps.class)
    delete newProps.class
  }

  if (newProps.className !== undefined && newProps.className !== null) {
    addClasses(newProps.className)
    delete newProps.className
  }

  newProps.className = [...classes]

  return newProps
}

/**
 * Fetches a callout's visual indicator.
 */
export function getIndicator(
  callouts: Callouts,
  type: string,
  tag: string,
  props: Properties | null
): Element | null {
  const indicator = callouts[type]?.indicator
  if (!indicator) return null

  const indicatorElement = fromHtml(indicator, {
    space: 'svg',
    fragment: true,
  })

  const properties = getProperties(props, defaultClassNames.titleIcon)
  properties['aria-hidden'] = 'true'

  return h(tag, properties, indicatorElement)
}

/**
 * Get fold icon when callout is collapsible.
 */
export function getFoldIcon(tag: string, props: Properties | null): Element {
  const icon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"></path></svg>'

  const foldIconElement = fromHtml(icon, {
    space: 'svg',
    fragment: true,
  })

  const properties = getProperties(props, defaultClassNames.foldIcon)
  properties['aria-hidden'] = 'true'

  return h(tag, properties, foldIconElement)
}
