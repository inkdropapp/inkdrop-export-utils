# Inkdrop Export Utils

Helper functions for exporting Markdown notes from Inkdrop. Works great with plugins.

## Installation

```
npm install inkdrop-export-utils --save
```

## Usage

Import functions and call them.

```javascript
import { renderHTML } from "inkdrop-export-utils";
```

### `async renderHTML (markdown: string): string`

Convert given Markdown to HTML.
It utilizes Inkdrop's rendering module to render it, so the output will be same as on the preview pane.
Extended Markdown syntaxes are also processed such as **math** and **sequence-diagrams**.

### `async createHTML(note: Note, options: { addTitle?: boolean, templateHtml?: string })`

Creates HTML from a given note.

- `options.addTitle`: `true` to add the note title to the top of the note (`# <title>`)
- `options.templateHtml`: A template HTML. (Default: A template loaded from `assets/template.html`)

### `getStylesheets (): string`

It returns stylesheets provided by plugins that would be necessary for exported HTMLs.

### `async replaceImages (markdown: string, dirToSave: string, basePath?: string): string`

It exports attached images to specified local directory and replaces URIs in Markdown with their paths.

### `async exportImage (uri: string, dirToSave: string): void`

Export an image with specified URI to the local directory (e.g., `inkdrop://file:H1unDnJFW`)

### `async replaceHTMLImagesWithDataURI (html: string): string`

It replaces image attachments represented with `inkdrop-file://` in HTML with data URIs (`data:<MIME-TYPE>;base64,<DATA>`).

## License

MIT
