import { fromHtml } from 'hast-util-from-html'
import { h } from 'hastscript'
import merge from 'lodash.merge'

import { docusaurusCallouts } from './themes/docusaurus/config.js'
import { githubCallouts } from './themes/github/config.js'
import { obsidianCallouts } from './themes/obsidian/config.js'
import { vitepressCallouts } from './themes/vitepress/config.js'

import type { ElementContent, Element } from 'hast'
import type { UserOptions, ConfigOptions, Callouts } from './types.js'

export const calloutRegex =
  /\[!(?<type>\w+)](?<collapsable>-{0,1})\s*(?<title>.*)/g

export const splitByNewlineRegex = /(?<prefix>[^\n]*)\n(?<suffix>[\S\s]*)/g

export const themes = {
  github: githubCallouts,
  obsidian: obsidianCallouts,
  vitepress: vitepressCallouts,
  docusaurus: docusaurusCallouts,
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
  }

  if (userOptions) {
    const { theme, callouts, aliases } = userOptions
    if (callouts) userOptions.callouts = convertKeysToLowercase(callouts)
    if (aliases) userOptions.aliases = convertKeysToLowercase(aliases)
    // console.log('userOptions.callouts', userOptions.callouts)
    // console.log('userOptions.aliases', userOptions.aliases)

    const initOptions = {
      theme: theme ?? 'obsidian',
      callouts: theme ? themes[theme] : themes.obsidian,
      aliases: {},
      showIndicator: true,
    }

    return merge(initOptions, userOptions)
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
  const expandedCallouts: Callouts = JSON.parse(
    JSON.stringify(callouts)
  ) as Callouts

  for (const key in aliases) {
    if (callouts[key]) {
      const aliasList = aliases[key]
      const originalCallout = callouts[key]
      for (const alias of aliasList) {
        expandedCallouts[alias] = originalCallout
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
  // return children.findIndex(c => c.type === 'text' && c.value.includes('\n'));
}

/**
 * Fetches a callout's visual indicator.
 *
 * @param {configOptions} config
 *   Configuration containing type-indicator mappings.
 * @param {string} type
 *   Callout type to fetch the indicator for.
 * @returns {(Element | undefined)}
 *   Indicator element or undefined if not found.
 */
export function getIndicator(
  config: ConfigOptions,
  type: string
): Element | undefined {
  const indicator = config.callouts[type]?.indicator
  if (!indicator) return

  const indicatorElement = fromHtml(indicator, {
    space: 'svg',
    fragment: true,
  })

  return h('div', { className: 'callout-icon' }, indicatorElement)
}
