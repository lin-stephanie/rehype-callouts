import { isElement } from 'hast-util-is-element'
import { h } from 'hastscript'
import { visit } from 'unist-util-visit'

import {
  calloutRegex,
  splitByNewlineRegex,
  getConfig,
  expandCallouts,
  findFirstNewline,
  getIndicator,
} from './utils.js'

import type { Root } from 'hast'
import type { Plugin } from 'unified'
import type { UserOptions } from './types.js'

/**
 * A rehype plugin for rendering themed callouts (admonitions/alerts).
 *
 * @param options
 *   Optional options to configure the output.
 * @returns
 *   A unified transformer.
 */
const rehypeCalloouts: Plugin<[UserOptions?], Root> = (options) => {
  const config = getConfig(options)
  const { theme, callouts, aliases, showIndicator } = config
  // console.log('config', config)

  return (tree) => {
    visit(tree, 'element', (node) => {
      // parse only blockquote
      if (!isElement(node, 'blockquote')) {
        return
      }

      // console.log('node', node)

      // strip useless nodes, leftovers from markdown
      node.children = node.children.filter(
        (c) => !(c.type === 'text' && c.value === '\n')
      )

      // empty blockquote don't concern us
      if (node.children.length === 0) return

      // the first element must be a paragraph
      if (!isElement(node.children[0], 'p')) return

      // empty paragraphs
      const firstParagraph = node.children[0]
      if (firstParagraph.children.length === 0) return

      // console.log('firstParagraph', firstParagraph)/

      // ignore paragraphs that don't start with plaintext
      if (firstParagraph.children[0].type !== 'text') return

      // handle aliases
      const expandedCallouts = expandCallouts(callouts, aliases)
      // console.log('expandedCallouts', expandedCallouts)

      // check for matches
      const match = calloutRegex.exec(firstParagraph.children[0].value)
      calloutRegex.lastIndex = 0
      // console.log('match.groups', match?.groups)
      if (
        !match?.groups ||
        !Object.keys(expandedCallouts).includes(match.groups.type)
      )
        return

      // check the first paragraph which may include a newline character (\n)
      const borderingIndex = findFirstNewline(firstParagraph.children)
      // console.log('borderingIndex', borderingIndex)

      // split it to two new elemnts
      if (borderingIndex !== -1) {
        const borderingElement = firstParagraph.children[borderingIndex]
        // console.log('borderingElement', borderingElement)
        if (borderingElement.type !== 'text') return

        const splitMatch = splitByNewlineRegex.exec(borderingElement.value)
        splitByNewlineRegex.lastIndex = 0

        /* if (splitMatch && splitMatch.groups) {
          const { prefix, suffix } = splitMatch.groups
          console.log('splitMatch', splitMatch.groups)

          node.children = [
            firstParagraph,
            h('p', suffix, node.children[0].children.slice(borderingIndex + 1)),
            ...node.children.slice(1),
          ]

          // if (isElement(!node.children[0]) || !('children' in node.children[0]))
          //   throw new Error()

          firstParagraph.children = firstParagraph.children
            .slice(0, borderingIndex)
            .concat([
              {
                type: 'text',
                value: prefix,
              },
            ])
        } */

        if (splitMatch?.groups) {
          const { prefix, suffix } = splitMatch.groups

          firstParagraph.children = [
            ...firstParagraph.children.slice(0, borderingIndex),
            { type: 'text', value: prefix },
          ]

          const newParagraph = h(
            'p',
            suffix,
            firstParagraph.children.slice(borderingIndex + 1)
          )

          node.children = [
            firstParagraph,
            newParagraph,
            ...node.children.slice(1),
          ]
        }

        // console.log('node.children', node.children)
        // // @ts-ignore
        // console.log('node.children1', node.children[0].children)
        // // @ts-ignore
        // console.log('node.children2', node.children[1].children)
      }

      // match callout format
      const firstTextNode = firstParagraph.children[0]
      // console.log('firstTextNode', firstTextNode)

      if (firstTextNode.type !== 'text') return
      const calloutMatch = calloutRegex.exec(firstTextNode.value)
      calloutRegex.lastIndex = 0

      if (!calloutMatch?.groups) return
      const { title, type, collapsable } = calloutMatch.groups
      // console.log('calloutMatch', calloutMatch.groups)

      // modify the blockquote element
      node.properties.className = [
        'callout-block',
        `callout-type-${type.toLowerCase()}`,
        collapsable && 'callout-collapsible',
      ]
      // @ts-expect-error (Type '"div" | "details"' is not assignable to type '"blockquote"')
      node.tagName = collapsable ? 'details' : 'div'

      // thrown away the now-empty paragraph
      /* firstTextNode.value = firstTextNode.value
        .substring(3 + kind.length + collapsable.length)
        .trim()
      if (
        firstTextNode.value.length == 0 &&
        firstParagraph.children.length == 1
      ) {
        node.children.shift()
      } */

      /* if (title !== '') {
        if (!node.children[0].properties) {
          node.children[0].properties = {}
        }
        node.children[0].properties.className = ['callout-title']
      } */

      // update hast
      node.children = [
        h(
          collapsable ? 'summary' : 'div',
          {
            className: ['callout-title-section'],
          },
          title === ''
            ? [
                showIndicator ? getIndicator(config, type) : null,
                h(
                  'p',
                  { className: ['callout-title'] },
                  callouts[type].title ??
                    (theme === 'github' || theme === 'obsidian'
                      ? type.charAt(0).toUpperCase() + type.slice(1)
                      : type.toUpperCase())
                ),
              ]
            : [
                showIndicator ? getIndicator(config, type) : null,
                h('p', { className: ['callout-title'] }, title),
              ]
        ),
        h(
          'div',
          {
            className: ['callout-content-section'],
          },
          title === '' ? node.children : node.children.slice(1)
        ),
      ]
    })
  }
}

export default rehypeCalloouts
