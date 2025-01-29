import { isElement } from 'hast-util-is-element'
import { h } from 'hastscript'
import { visit } from 'unist-util-visit'

import {
  calloutRegex,
  splitByNewlineRegex,
  defaultClassNames,
  createIfNeeded,
  getConfig,
  expandCallouts,
  handleBrAfterTitle,
  findFirstNewline,
  mergeConsecutiveTextNodes,
  getProperties,
  getIndicator,
  getFoldIcon,
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
 *
 * @see https://github.com/lin-stephanie/rehype-callouts
 */
const rehypeCallouts: Plugin<[UserOptions?], Root> = (options) => {
  const config = getConfig(options)
  const { theme, callouts, aliases, showIndicator, tags, props } = config
  const {
    nonCollapsibleContainerTagName,
    nonCollapsibleTitleTagName,
    contentTagName,
    titleIconTagName,
    titleTextTagName,
    foldIconTagName,
  } = tags
  const {
    containerProps,
    titleProps,
    contentProps,
    titleIconProps,
    titleTextProps,
    foldIconProps,
  } = props

  return (tree) => {
    visit(tree, 'element', (node) => {
      // parse only blockquote
      if (!isElement(node, 'blockquote')) return

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

      // ignore paragraphs that don't start with plaintext
      if (firstParagraph.children[0].type !== 'text') return

      // handle aliases
      const aliasMap = expandCallouts(callouts, aliases)

      // check for matches
      const match = calloutRegex.exec(firstParagraph.children[0].value)
      calloutRegex.lastIndex = 0
      const lowerType = match?.groups?.type.toLowerCase()
      if (!lowerType || !(lowerType in callouts || lowerType in aliasMap))
        return

      // remove double spaces ('br') after title
      firstParagraph.children = handleBrAfterTitle(firstParagraph.children)

      // handle no customized title
      // check the first paragraph which may include a newline character (\n)
      const borderingIndex = findFirstNewline(firstParagraph.children)

      // split it to two new elemnts
      if (borderingIndex !== -1) {
        const borderingElement = firstParagraph.children[borderingIndex]
        if (borderingElement.type !== 'text') return

        const splitMatch = splitByNewlineRegex.exec(borderingElement.value)
        splitByNewlineRegex.lastIndex = 0

        if (splitMatch?.groups) {
          const { prefix, suffix } = splitMatch.groups

          // handle prefix
          const firstParagraphNewChildren = [
            ...node.children[0].children.slice(0, borderingIndex),
            ...(prefix ? [{ type: 'text' as const, value: prefix }] : []),
          ]

          // handle suffix & update node.children
          if (suffix) {
            const newParagraph = h(
              'p',
              suffix,
              node.children[0].children.slice(borderingIndex + 1)
            )

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

            node.children = [
              { ...firstParagraph, children: firstParagraphNewChildren },
              newParagraph,
              ...node.children.slice(1),
            ]
          }
        }
      }

      // get callout type
      const revisedType =
        lowerType in callouts && !(lowerType in aliasMap)
          ? lowerType
          : aliasMap[lowerType]

      // get props
      const containerProperties = createIfNeeded(
        containerProps,
        node,
        revisedType
      )
      const titleProperties = createIfNeeded(titleProps, node, revisedType)
      const contentProperties = createIfNeeded(contentProps, node, revisedType)
      const titleIconProperties = createIfNeeded(
        titleIconProps,
        node,
        revisedType
      )
      const titleTextProperties = createIfNeeded(
        titleTextProps,
        node,
        revisedType
      )
      const foldIconProperties = createIfNeeded(
        foldIconProps,
        node,
        revisedType
      )

      // get title and collapsable
      const newFirstParagraph = node.children[0]
      if (!isElement(newFirstParagraph)) return

      const firstTextNode = newFirstParagraph.children[0]
      if (firstTextNode.type !== 'text') return

      mergeConsecutiveTextNodes(newFirstParagraph.children)

      const calloutMatch = calloutRegex.exec(firstTextNode.value)
      calloutRegex.lastIndex = 0
      if (!calloutMatch?.groups) return
      const { title, collapsable } = calloutMatch.groups

      // handle title text
      if (title) {
        firstTextNode.value = title
      } else {
        newFirstParagraph.children.shift()
      }

      newFirstParagraph.tagName = titleTextTagName
      newFirstParagraph.properties = getProperties(
        titleTextProperties,
        defaultClassNames.titleText
      )

      // handle container
      // @ts-expect-error (Type 'string' is not assignable to type '"blockquote"'.ts(2322))
      node.tagName = collapsable ? 'details' : nonCollapsibleContainerTagName
      node.properties = getProperties(
        containerProperties,
        defaultClassNames.container
      )

      node.properties['data-callout'] = revisedType
      node.properties['data-collapsible'] = collapsable ? 'true' : 'false'
      // https://developer.mozilla.org/en-US/docs/Glossary/Boolean/HTML
      node.properties.open = collapsable === '+' ? 'open' : undefined

      // update hast
      node.children = [
        h(
          collapsable ? 'summary' : nonCollapsibleTitleTagName,
          getProperties(titleProperties, defaultClassNames.title),
          [
            showIndicator
              ? getIndicator(
                  callouts,
                  revisedType,
                  titleIconTagName,
                  titleIconProperties
                )
              : null,
            newFirstParagraph.children.length > 0
              ? newFirstParagraph
              : h(
                  titleTextTagName,
                  getProperties(
                    titleTextProperties,
                    defaultClassNames.titleText
                  ),
                  callouts[revisedType].title ??
                    (theme === 'github' || theme === 'obsidian'
                      ? revisedType.charAt(0).toUpperCase() +
                        revisedType.slice(1)
                      : revisedType.toUpperCase())
                ),
            collapsable
              ? getFoldIcon(foldIconTagName, foldIconProperties)
              : null,
          ]
        ),
        h(
          contentTagName,
          getProperties(contentProperties, defaultClassNames.content),
          node.children.slice(1)
        ),
      ]
    })
  }
}

export default rehypeCallouts
export type {
  UserOptions,
  CalloutConfig,
  TagsConfig,
  PropsConfig,
  CreateProperties,
} from './types.js'
