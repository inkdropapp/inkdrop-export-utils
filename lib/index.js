'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.renderHTML = renderHTML;
exports.getStylesheets = getStylesheets;
exports.replaceImages = replaceImages;
exports.exportImage = exportImage;

var _inkdrop = require('inkdrop');

async function renderHTML(markdown) {
  const { MDEPreview } = inkdrop.components.classes;
  const processor = MDEPreview.getRemarkProcessor();
  const file = await processor.process(markdown);
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.zIndex = -1000;
  document.body.appendChild(container);

  _inkdrop.ReactDOM.render(file.contents, container);
  let html = container.innerHTML;

  document.body.removeChild(container);

  return html;
}

function getStylesheets() {
  return inkdrop.styles.getStyleElements().filter(el => {
    return typeof el.context === 'undefined' || el.context === 'inkdrop-preview';
  }).reduce((styles, el) => {
    return styles + el.outerHTML;
  }, '');
}

async function replaceImages(body, dirToSave) {
  // find attachments
  const uris = body.match(/inkdrop:\/\/file:[^) ]*/g) || [];
  for (let i = 0; i < uris.length; ++i) {
    const uri = uris[i];
    const imagePath = await this.exportImage(uri, dirToSave);
    if (imagePath) {
      body = body.replace(uri, imagePath);
    }
  }
  return body;
}

async function exportImage(uri, dirToSave) {
  try {
    const file = await inkdrop.models.File.getDocumentFromUri(uri);
    return file.saveFileSync(dirToSave);
  } catch (e) {
    console.error('Failed to export image file:', e);
    return false;
  }
}