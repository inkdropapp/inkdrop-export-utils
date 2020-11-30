// @flow
import fs from 'fs'
import path from 'path'
import * as React from 'react'
import ReactDOM from 'react-dom'
import { markdownRenderer, logger } from 'inkdrop'
import { Provider } from 'react-redux'
import type { Note } from 'inkdrop-model'

export async function renderHTML(markdown: string) {
  const file = await markdownRenderer.render(markdown)
  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.zIndex = '-1000'
  const { body } = document
  if (body) {
    body.appendChild(container)
    ReactDOM.render(
      <Provider store={inkdrop.store}>{file.result}</Provider>,
      container
    )
    const html = container.innerHTML
    body.removeChild(container)

    return html
  } else {
    throw new Error('Unexpected error')
  }
}

export function getStylesheets() {
  return inkdrop.styles
    .getStyleElements()
    .filter(el => {
      return (
        typeof el.context === 'undefined' || el.context === 'inkdrop-preview'
      )
    })
    .reduce((styles, el) => {
      return styles + el.outerHTML
    }, '')
}

export async function replaceImages(
  body: string,
  dirToSave: string,
  basePath?: string
) {
  // find attachments
  const uris = body.match(/inkdrop:\/\/file:[^) "']*/g) || []
  for (let i = 0; i < uris.length; ++i) {
    const uri = uris[i]
    let imagePath = await exportImage(uri, dirToSave)
    if (typeof imagePath === 'string') {
      if (basePath) imagePath = path.relative(basePath, imagePath)
      body = body.replace(uri, imagePath)
    }
  }
  return body
}

export async function replaceHTMLImagesWithDataURI(html: string) {
  const { File: IDFile } = require('inkdrop').models
  const m = html.match(/inkdrop-file:\/\/file:[^"]*/g)
  if (m instanceof Array && m.length > 0) {
    for (const uri of m) {
      try {
        const [, docId] = uri.match(/\/\/(file:.*)$/)
        const file = await IDFile.loadWithId(docId)
        const base64 = file.getAsBase64()
        html = html.replace(uri, `data:${file.contentType};base64,${base64}`)
      } catch (e) {
        logger.error('Failed to replace images with data URI:', uri)
        logger.error(e)
      }
    }
  }
  return html
}

export async function exportImage(uri: string, dirToSave: string) {
  try {
    const { dataStore } = inkdrop.main
    const db = dataStore.getLocalDB()
    const [, docId] = uri.match(/^inkdrop:\/\/(file:.*)$/) || []
    if (docId) {
      const file = await db.files.get(docId)
      const buffer = await db.utils.getBufferFromFile(docId)

      const name = file.name || 'index'
      const fileName = docId.split(':')[1] + '-' + name
      const filePath = path.join(dirToSave, fileName)
      fs.writeFileSync(filePath, buffer)

      return filePath
    }
  } catch (e) {
    console.error('Failed to export image file:', e)
    return false
  }
}

export async function createHTML(
  note: Note,
  options: {
    addTitle?: boolean,
    templateHtml?: string
  } = { addTitle: true }
) {
  const templateFilePath = require.resolve(
    path.join('inkdrop-export-utils', 'assets', 'template.html')
  )
  const templateHtml =
    options.templateHtml || fs.readFileSync(templateFilePath, 'utf-8')

  const markdown = options.addTitle
    ? addTitleToMarkdown(note.body, note.title)
    : note.body
  const htmlBody = await renderHTML(markdown)
  const htmlStyles = getStylesheets()
  const outputHtml = templateHtml
    .replace('{%body%}', htmlBody)
    .replace('{%styles%}', htmlStyles)
    .replace('{%title%}', note.title)
  return outputHtml
}

export function addTitleToMarkdown(md: string, title: string) {
  const match = md.match(/^---\n.*?---/ms)
  if (match instanceof Array && match.length > 0 && match.index === 0) {
    const frontmatter = match[0]
    return `${frontmatter}\n# ${title}\n${md.substr(frontmatter.length)}`
  } else {
    const linebreaks = md.split('\n', 1)[0].length === 0 ? '\n' : '\n\n'
    return `# ${title}${linebreaks}${md}`
  }
}

export async function createWebView(note: Note) {
  const outputHtml = await createHTML(note, { addTitle: true })
  const fn = saveHTMLToTmp(outputHtml)
  const webView: Object = document.createElement('webview')
  window.document.body.appendChild(webView)
  webView.style.position = 'absolute'
  webView.src = fn
  await new Promise((resolve, reject) => {
    let resolved = false
    const done = () => {
      if (!resolved) {
        resolved = true
        resolve()
      }
    }
    webView.addEventListener('did-finish-load', done)
    webView.addEventListener('did-fail-load', reject)
    setTimeout(done, 1000 * 5)
  })
  return webView
}

export function removeWebView(webView: Object, delay: number = 30 * 60 * 1000) {
  setTimeout(() => window.document.body.removeChild(webView), delay)
}

export function saveHTMLToTmp(html: string) {
  const fn = path.join(require('os').tmpdir(), 'inkdrop-export.html')
  fs.writeFileSync(fn, html, 'utf-8')
  return fn
}
