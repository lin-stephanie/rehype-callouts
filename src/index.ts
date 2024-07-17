import { isElement } from 'hast-util-is-element'
import { h } from 'hastscript'
import { visit } from 'unist-util-visit'

import {
  calloutRegex,
  splitByNewlineRegex,
  getConfig,
  expandCallouts,
  handleBrAfterTitle,
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
      console.log('firstParagraph', firstParagraph)

      // ignore paragraphs that don't start with plaintext
      if (firstParagraph.children[0].type !== 'text') return

      // handle aliases
      const expandedCallouts = expandCallouts(callouts, aliases)
      // console.log('expandedCallouts', expandedCallouts)

      // check for matches
      const match = calloutRegex.exec(firstParagraph.children[0].value)
      calloutRegex.lastIndex = 0
      // console.log('match', match)
      if (
        !match?.groups ||
        !Object.keys(expandedCallouts).includes(match.groups.type.toLowerCase())
      )
        return

      // console.log('node.children', node.children)
      // console.log('p1', firstParagraph)

      // remove double spaces ('br') after title
      firstParagraph.children = handleBrAfterTitle(firstParagraph.children)
      // console.log('p1', firstParagraph)

      // handle no customized title
      // check the first paragraph which may include a newline character (\n)
      const borderingIndex = findFirstNewline(firstParagraph.children)
      console.log('borderingIndex', borderingIndex)

      // split it to two new elemnts
      if (borderingIndex !== -1) {
        const borderingElement = firstParagraph.children[borderingIndex]
        // console.log('borderingElement', borderingElement)

        if (borderingElement.type !== 'text') return

        const splitMatch = splitByNewlineRegex.exec(borderingElement.value)
        splitByNewlineRegex.lastIndex = 0
        // console.log('splitMatch', splitMatch)

        if (splitMatch?.groups) {
          const { prefix, suffix } = splitMatch.groups

          // handle prefix
          const firstParagraphNewChildren = [
            ...node.children[0].children.slice(0, borderingIndex),
            ...(prefix ? [{ type: 'text' as const, value: prefix }] : []),
          ]
          console.log('firstParagraphNewChildren', firstParagraphNewChildren)

          // handle suffix & update node.children
          if (suffix) {
            const newParagraph = h(
              'p',
              suffix,
              node.children[0].children.slice(borderingIndex + 1)
            )
            console.log('newParagraph', newParagraph)

            node.children = [
              { ...firstParagraph, children: firstParagraphNewChildren },
              newParagraph,
              ...node.children.slice(1),
            ]
          } else {
            const newParagraph = h(
              'p',
              node.children[0].children.slice(borderingIndex + 1)
            )
            console.log('newParagraph', newParagraph)

            node.children = [
              { ...firstParagraph, children: firstParagraphNewChildren },
              newParagraph,
              ...node.children.slice(1),
            ]
          }
        }

        // console.log('node.children', node.children)
        // console.log('p1', node.children[0])
        // console.log('p2', node.children[1])
        // console.log('p3', node.children[2])
      }

      // match callout format
      const newFirstParagraph = node.children[0]
      if (!isElement(newFirstParagraph)) return
      const firstTextNode = newFirstParagraph.children[0]
      console.log('firstTextNode', firstTextNode)

      if (firstTextNode.type !== 'text') return
      const calloutMatch = calloutRegex.exec(firstTextNode.value)
      calloutRegex.lastIndex = 0
      if (!calloutMatch?.groups) return
      const { title, type, collapsable } = calloutMatch.groups
      console.log('calloutMatch', calloutMatch)

      // format type to lowercase & remove callout format
      const revisedType = type.toLowerCase()
      firstTextNode.value = firstTextNode.value
        .slice(Math.max(0, 3 + type.length + collapsable.length))
        .trim()
      newFirstParagraph.properties.className = ['callout-title-inner']

      // modify the blockquote element
      node.properties.className = [
        'callout',
        collapsable && 'callout-collapsible',
      ]
      // @ts-expect-error (Type '"div" | "details"' is not assignable to type '"blockquote"')
      node.tagName = collapsable ? 'details' : 'div'

      console.log('node.children', node.children)
      console.log('p1', node.children[0])
      console.log('p2', node.children[1])

      // update hast
      node.children = [
        h(
          collapsable ? 'summary' : 'div',
          {
            className: ['callout-title'],
          },
          title
            ? [
                showIndicator ? getIndicator(config, revisedType) : null,
                node.children[0],
              ]
            : [
                showIndicator ? getIndicator(config, revisedType) : null,
                h(
                  'p',
                  { className: ['callout-title-inner'] },
                  callouts[revisedType].title ??
                    (theme === 'github' || theme === 'obsidian'
                      ? revisedType.charAt(0).toUpperCase() +
                        revisedType.slice(1)
                      : revisedType.toUpperCase())
                ),
              ]
        ),
        h(
          'div',
          {
            className: ['callout-content'],
          },
          node.children.slice(1)
        ),
      ]
    })
  }
}

export default rehypeCalloouts
