"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.renderHTML = renderHTML;
exports.getStylesheets = getStylesheets;
exports.replaceImages = replaceImages;
exports.exportImage = exportImage;
exports.createHTML = createHTML;
exports.createWebView = createWebView;
exports.removeWebView = removeWebView;
exports.saveHTMLToTmp = saveHTMLToTmp;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var React = _interopRequireWildcard(require("react"));

var _reactDom = _interopRequireDefault(require("react-dom"));

var _inkdrop = require("inkdrop");

var _reactRedux = require("react-redux");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

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

    _reactDom["default"].render(React.createElement(_reactRedux.Provider, {
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

async function replaceImages(body, dirToSave, basePath) {
  // find attachments
  const uris = body.match(/inkdrop:\/\/file:[^) "']*/g) || [];

  for (let i = 0; i < uris.length; ++i) {
    const uri = uris[i];
    let imagePath = await exportImage(uri, dirToSave);

    if (typeof imagePath === 'string') {
      if (basePath) imagePath = _path["default"].relative(basePath, imagePath);
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

      const filePath = _path["default"].join(dirToSave, fileName);

      _fs["default"].writeFileSync(filePath, buffer);

      return filePath;
    }
  } catch (e) {
    console.error('Failed to export image file:', e);
    return false;
  }
}

async function createHTML(note) {
  const templateFilePath = require.resolve(_path["default"].join('inkdrop-export-utils', 'assets', 'template.html'));

  const templateHtml = _fs["default"].readFileSync(templateFilePath, 'utf-8');

  const markdown = `# ${note.title}\n${note.body}`;
  const htmlBody = await renderHTML(markdown);
  const htmlStyles = getStylesheets();
  const outputHtml = templateHtml.replace('{%body%}', htmlBody).replace('{%styles%}', htmlStyles).replace('{%title%}', note.title);
  return outputHtml;
}

async function createWebView(note) {
  const outputHtml = await createHTML(note);
  const fn = saveHTMLToTmp(outputHtml);
  const webView = document.createElement('webview');
  window.document.body.appendChild(webView);
  webView.src = fn;
  await new Promise(resolve => {
    webView.addEventListener('did-finish-load', resolve);
  });
  return webView;
}

function removeWebView(webView, delay = 30 * 60 * 1000) {
  setTimeout(() => window.document.body.removeChild(webView), delay);
}

function saveHTMLToTmp(html) {
  const fn = _path["default"].join(require('os').tmpdir(), 'inkdrop-export.html');

  _fs["default"].writeFileSync(fn, html, 'utf-8');

  return fn;
}