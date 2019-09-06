// @flow
import fs from 'fs'
import path from 'path'
import * as React from 'react'
import ReactDOM from 'react-dom'
import { markdownRenderer } from 'inkdrop'
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
      <Provider store={inkdrop.store}>{file.contents}</Provider>,
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

export async function createHTML(note: Note) {
  const templateFilePath = require.resolve(
    path.join('inkdrop-export-utils', 'assets', 'template.html')
  )
  const templateHtml = fs.readFileSync(templateFilePath, 'utf-8')

  const markdown = `# ${note.title}\n${note.body}`
  const htmlBody = await renderHTML(markdown)
  const htmlStyles = getStylesheets()
  const outputHtml = templateHtml
    .replace('{%body%}', htmlBody)
    .replace('{%styles%}', htmlStyles)
    .replace('{%title%}', note.title)
  return outputHtml
}

export async function createWebView(note: Note) {
  const outputHtml = await createHTML(note)
  const fn = saveHTMLToTmp(outputHtml)
  const webView: Object = document.createElement('webview')
  window.document.body.appendChild(webView)
  webView.src = fn
  await new Promise(resolve => {
    webView.addEventListener('did-finish-load', resolve)
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
