// @flow
import test from 'ava'
import { addTitleToMarkdown } from './lib/add-title-to-markdown'

test('add title to Markdown', async t => {
  const md = `some text`
  const md2 = addTitleToMarkdown(md, 'Title')
  t.is(md2, `# Title\n\nsome text`)
})

test('add title to Markdown with the first blank line', async t => {
  const md = `\nsome text`
  const md2 = addTitleToMarkdown(md, 'Title')
  t.is(md2, `# Title\n\nsome text`)
})

test('add title to Markdown with YAML frontmatter', async t => {
  const md = `---\nfoo: bar\n---\nsome text`
  const md2 = addTitleToMarkdown(md, 'Title')
  t.log(md2)
  t.is(md2, `---\nfoo: bar\n---\n# Title\n\nsome text`)
})
