"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.renderHTML = renderHTML;
exports.getStylesheets = getStylesheets;
exports.replaceImages = replaceImages;
exports.exportImage = exportImage;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _reactDom = _interopRequireDefault(require("react-dom"));

var _inkdrop = require("inkdrop");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

async function renderHTML(markdown) {
  const file = await _inkdrop.markdownRenderer.render(markdown);
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.zIndex = '-1000';
  const {
    body
  } = document;

  if (body) {
    body.appendChild(container);

    _reactDom.default.render(file.contents, container);

    const html = container.innerHTML;
    body.removeChild(container);
    return html;
  } else {
    throw new Error('Unexpected error');
  }
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
    const {
      dataStore
    } = inkdrop.main;
    const db = dataStore.getLocalDB();
    const [, docId] = uri.match(/^inkdrop:\/\/(file:.*)$/) || [];

    if (docId) {
      const file = await db.file.get(docId);
      const buffer = await db.utils.getBufferFromFile(docId);
      const name = file.name || 'index';
      const fileName = docId.split(':')[1] + '-' + name;

      const filePath = _path.default.join(dirToSave, fileName);

      _fs.default.writeFileSync(filePath, buffer);

      return filePath;
    }
  } catch (e) {
    console.error('Failed to export image file:', e);
    return false;
  }
}