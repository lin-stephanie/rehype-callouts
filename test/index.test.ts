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
      .use(rehypeCalloouts, options)
      .use(rehypeMinifyWhitespace)
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
  console.log('input', input)
  console.log('output', output)

  test(name, () => {
    expect(input).toBe(output)
  })
}

run('basic')
