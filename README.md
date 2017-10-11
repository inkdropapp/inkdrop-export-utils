Inkdrop Export Utils
=====================

Helper functions for exporting Markdown notes from Inkdrop. Works great with plugins.

## Installation

```
npm install inkdrop-export-utils --save
```

## Usage

Import functions and call them.

```javascript
import { renderHTML } from 'inkdrop-export-utils'
```

### `async renderHTML (markdown: string)`

Convert given Markdown to HTML.
It utilizes Inkdrop's rendering module to render it, so the output will be same as on the preview pane.
Extended Markdown syntaxes are also processed such as **math** and **sequence-diagrams**.

### `getStylesheets ()`

It returns stylesheets provided by plugins that would be necessary for exported HTMLs.

### `async replaceImages (markdown: string, dirToSave: string)`

It exports attached images to specified local directory and replaces URIs in Markdown with their paths.

### `async exportImage (uri: string, dirToSave: string)`

Export an image with specified URI to the local directory (e.g., `inkdrop://file:H1unDnJFW`)

## License

MIT