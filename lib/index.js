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

var React = _interopRequireWildcard(require("react"));

var _reactDom = _interopRequireDefault(require("react-dom"));

var _inkdrop = require("inkdrop");

var _reactRedux = require("react-redux");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

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

    _reactDom.default.render(React.createElement(_reactRedux.Provider, {
      store: inkdrop.store
    }, file.contents), container);

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
      const file = await db.files.get(docId);
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