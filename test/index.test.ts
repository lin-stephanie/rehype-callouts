import rehypeMinifyWhitespace from 'rehype-minify-whitespace'
import rehypeParse from 'rehype-parse'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { readSync } from 'to-vfile'
import { unified } from 'unified'
import { test, expect } from 'vitest'

import rehypeCalloouts from '../src/index.js'

import type { UserOptions } from '../src/types.js'

function run(name: string, options?: UserOptions, fromHtml = false) {
  // handle input
  let input: string
  if (fromHtml) {
    const fromHtmlProcessor = unified()
      .use(rehypeParse, { fragment: true })
      .use(rehypeMinifyWhitespace)
      .use(rehypeCalloouts, options)
      .use(rehypeStringify)

    input = String(
      fromHtmlProcessor.processSync(
        readSync(`./test/fixtures/${name}/input.html`)
      )
    )
  } else {
    const fromMarkdownProcessor = unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeCalloouts, options)
      .use(rehypeMinifyWhitespace)
      .use(rehypeStringify)

    input = String(
      fromMarkdownProcessor.processSync(
        readSync(`./test/fixtures/${name}/input.md`)
      )
    )
  }

  // handle output
  const output = String(
    unified()
      .use(rehypeParse, { fragment: true })
      .use(rehypeMinifyWhitespace)
      .use(rehypeStringify)
      .processSync(readSync(`./test/fixtures/${name}/output.html`))
  )

  // test
  test(name, () => {
    expect(input).toBe(output)
  })
}

run('openOrClose')
run('readmeExample')
run('basic', { showIndicator: false })
run('fromHtml', { showIndicator: false }, true)
run('collapsibleCallouts', { showIndicator: false })
run('markdownInTitle', { showIndicator: false })
run('nestedCallouts', { showIndicator: false })
run('showIndicator', { aliases: { note: ['n'] } })
run('customTheme', {
  theme: 'vitepress',
  callouts: {
    customtype: {},
  },
})
run('customAliases', {
  aliases: { note: ['no', 'n'], tip: ['t', 'T'] },
  showIndicator: false,
})
run('customCallouts', {
  callouts: {
    customtype: {
      title: 'Customtype',
      indicator:
        '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m3 11l19-9l-9 19l-2-8z"/></svg>',
      color: 'rgb(227, 107, 167)',
    },
    noindicator: {
      title: 'NO INDICATOR',
      color: ['#e36ba7', '#f86bb7'],
    },
    notitle: {
      indicator:
        '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m3 11l19-9l-9 19l-2-8z"/></svg>',
      color: 'rgb(227, 107, 167)',
    },
    nothing: {},
  },
})
run('modifyCallouts', {
  callouts: {
    note: {
      title: 'Modified title',
    },
    tip: {
      title: 'Modified indicator',
      indicator:
        '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m3 11l19-9l-9 19l-2-8z"/></svg>',
    },
    important: {
      title: 'Modified color',
      indicator:
        '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m3 11l19-9l-9 19l-2-8z"/></svg>',
      color: ['#e36ba7', '#f86bb7'],
    },
  },
})
run('htmlTagName', {
  htmlTagNames: {
    nonCollapsibleContainerTagName: 'blockquote',
    nonCollapsibleTitleTagName: 'h6',
    nonCollapsibleContentTagName: 'blockquote',
    collapsibleContentTagName: 'blockquote',
    iconTagName: 'span',
    titleInnerTagName: 'div',
  },
})
