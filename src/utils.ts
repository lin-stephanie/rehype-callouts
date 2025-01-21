import { fromHtml } from 'hast-util-from-html'
import { h } from 'hastscript'

import { githubCallouts } from './themes/github/config.js'
import { obsidianCallouts } from './themes/obsidian/config.js'
import { vitepressCallouts } from './themes/vitepress/config.js'

import type { ElementContent, Element, Text } from 'hast'
import type { UserOptions, ConfigOptions, Callouts } from './types.js'

export const calloutRegex =
  /\[!(?<type>\w+)](?<collapsable>[+-]?)\s*(?<title>.*)/g

export const splitByNewlineRegex = /(?<prefix>[^\n]*)\n(?<suffix>[\S\s]*)/g

export const themes = {
  github: githubCallouts,
  obsidian: obsidianCallouts,
  vitepress: vitepressCallouts,
}

/**
 * Converts aproperty keys of the object to lowercase.
 *
 * @param {Record<string, any>} object
 *   The object whose keys are to be converted to lowercase.
 * @returns {Record<string, any>}
 *   A new object with all keys converted to lowercase.
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
 *
 * @param {(userOptions | undefined)} userOptions
 *   Optional user-specific settings to override defaults.
 * @returns {configOptions}
 *   The complete configuration object.
 */
export function getConfig(userOptions: UserOptions | undefined): ConfigOptions {
  const defaultOptions: ConfigOptions = {
    theme: 'obsidian',
    callouts: themes.obsidian,
    aliases: {},
    showIndicator: true,
    htmlTagNames: {
      nonCollapsibleContainerTagName: 'div',
      nonCollapsibleTitleTagName: 'div',
      nonCollapsibleContentTagName: 'div',
      collapsibleContentTagName: 'div',
      iconTagName: 'div',
      titleInnerTagName: 'div',
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
      htmlTagNames: {
        ...defaultOptions.htmlTagNames,
        ...userOptions.htmlTagNames,
      },
    }
  }

  return defaultOptions
}

/**
 * Expands the original callouts object based on aliases.
 *
 * @param {Callouts} callouts
 *   The original callouts object.
 * @param {Record<string, string[]>} aliases
 *   An object mapping callout types to arrays of aliases.
 * @returns {Callouts}
 *   The expanded callouts object including both original and alias-mapped callouts.
 */
export function expandCallouts(
  callouts: Callouts,
  aliases: Record<string, string[]>
): Callouts {
  if (Object.keys(aliases).length === 0) return callouts

  const expandedCallouts: Callouts = JSON.parse(
    JSON.stringify(callouts)
  ) as Callouts

  for (const [key, aliasList] of Object.entries(aliases)) {
    const lowerKey = key.toLowerCase()
    const originalCallout = expandedCallouts[lowerKey]

    if (originalCallout) {
      const processedAliases = new Set<string>()
      for (const alias of aliasList) {
        const lowerAlias = alias.toLowerCase()
        if (!processedAliases.has(lowerAlias)) {
          expandedCallouts[lowerAlias] = originalCallout
          processedAliases.add(lowerAlias)
        }
      }
    }
  }

  return expandedCallouts
}

/**
 * Cleanup due to double spaces after title in Markdown
 * being converted to <br> tags.
 *
 * @param {ElementContent[]} children
 *   The array of HTML element to process.
 * @returns {*}
 *   The new array with specified elements removed.
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
 *
 * @param {ElementContent[]} children
 *   Array of HAST child nodes.
 * @returns {number}
 *   Index of the first text node with a newline, or -1 if none found.
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
 *
 * @param {ElementContent} node
 *   The node to check.
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
 *
 * @param {Array} children
 *   The children nodes of a HAST structure.
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
 * Generate CSS style strings.
 *
 * @param {(undefined | string | [string, string])} color
 *   Color to use for callout.
 * @returns {string}
 *   CSS variable string used for callout.
 */
export function generateStyle(
  color: undefined | string | [string, string]
): string {
  if (Array.isArray(color)) {
    return `--callout-color-light: ${color[0]}; --callout-color-dark: ${color[1]};`
  }

  if (typeof color === 'string') {
    return `--callout-color-light: ${color}; --callout-color-dark: ${color};`
  }

  return `--callout-color-light: #888; --callout-color-dark: #888;`
}

/**
 * Fetches a callout's visual indicator.
 *
 * @param {configOptions} callouts
 *   Configuration containing type-indicator mappings.
 * @param {string} type
 *   Callout type to fetch the indicator for.
 * @param {string} iconTagName
 *   Tag name for the icon container.
 * @returns {(Element | undefined)}
 *   SVG element or undefined if not found.
 */
export function getIndicator(
  callouts: Callouts,
  type: string,
  iconTagName: string
): Element | undefined {
  const indicator = callouts[type]?.indicator
  if (!indicator) return

  const indicatorElement = fromHtml(indicator, {
    space: 'svg',
    fragment: true,
  })

  return h(
    iconTagName,
    { className: 'callout-icon', ariaHidden: 'true' },
    indicatorElement
  )
}

/**
 * Get fold icon when callout is collapsible.
 *
 * @param {string} iconTagName
 *   Tag name for the icon container.
 * @returns {Element}
 *   SVG element.
 */
export function getFoldIcon(iconTagName: string): Element {
  const icon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"></path></svg>'
  const foldIconElement = fromHtml(icon, {
    space: 'svg',
    fragment: true,
  })

  return h(
    iconTagName,
    { className: 'callout-fold', ariaHidden: 'true' },
    foldIconElement
  )
}
