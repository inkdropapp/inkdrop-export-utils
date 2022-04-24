import { addTitleToMarkdown } from '../src/add-title-to-markdown'

test('add title to Markdown', async () => {
  const md = `some text`
  const md2 = addTitleToMarkdown(md, 'Title')
  expect(md2).toBe(`# Title\n\nsome text`)
})
test('add title to Markdown with the first blank line', async () => {
  const md = `\nsome text`
  const md2 = addTitleToMarkdown(md, 'Title')
  expect(md2).toBe(`# Title\n\nsome text`)
})
test('add title to Markdown with YAML frontmatter', async () => {
  const md = `---\nfoo: bar\n---\nsome text`
  const md2 = addTitleToMarkdown(md, 'Title')
  console.log(md2)
  expect(md2).toBe(`---\nfoo: bar\n---\n# Title\n\nsome text`)
})
