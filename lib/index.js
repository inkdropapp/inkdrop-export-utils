"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.renderHTML = renderHTML;
exports.getStylesheets = getStylesheets;
exports.replaceImages = replaceImages;
exports.replaceHTMLImagesWithDataURI = replaceHTMLImagesWithDataURI;
exports.exportImage = exportImage;
exports.createHTML = createHTML;
exports.createWebView = createWebView;
exports.removeWebView = removeWebView;
exports.saveHTMLToTmp = saveHTMLToTmp;
Object.defineProperty(exports, "addTitleToMarkdown", {
  enumerable: true,
  get: function () {
    return _addTitleToMarkdown.addTitleToMarkdown;
  }
});

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var React = _interopRequireWildcard(require("react"));

var _reactDom = _interopRequireDefault(require("react-dom"));

var _inkdrop = require("inkdrop");

var _reactRedux = require("react-redux");

var _addTitleToMarkdown = require("./add-title-to-markdown");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

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

    _reactDom.default.render( /*#__PURE__*/React.createElement(_reactRedux.Provider, {
      store: inkdrop.store
    }, file.result), container);

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
      if (basePath) imagePath = _path.default.relative(basePath, imagePath);
      body = body.replace(uri, imagePath);
    }
  }

  return body;
}

async function replaceHTMLImagesWithDataURI(html) {
  const {
    File: IDFile
  } = require('inkdrop').models;

  const m = html.match(/inkdrop-file:\/\/file:[^"]*/g);

  if (m instanceof Array && m.length > 0) {
    for (const uri of m) {
      try {
        const [, docId] = uri.match(/\/\/(file:.*)$/);
        const file = await IDFile.loadWithId(docId);
        const base64 = file.getAsBase64();
        html = html.replace(uri, () => `data:${file.contentType};base64,${base64}`);
      } catch (e) {
        _inkdrop.logger.error('Failed to replace images with data URI:', uri);

        _inkdrop.logger.error(e);
      }
    }
  }

  return html;
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

async function createHTML(note, options = {
  addTitle: true
}) {
  const templateFilePath = require.resolve(_path.default.join('inkdrop-export-utils', 'assets', 'template.html'));

  const templateHtml = options.templateHtml || _fs.default.readFileSync(templateFilePath, 'utf-8');

  const markdown = options.addTitle ? (0, _addTitleToMarkdown.addTitleToMarkdown)(note.body, note.title) : note.body;
  const htmlBody = await renderHTML(markdown);
  const htmlStyles = getStylesheets();
  const outputHtml = templateHtml.replace('{%body%}', () => htmlBody).replace('{%styles%}', () => htmlStyles).replace('{%title%}', () => note.title);
  return outputHtml;
}

async function createWebView(note) {
  const outputHtml = await createHTML(note, {
    addTitle: true
  });
  const fn = saveHTMLToTmp(outputHtml);
  const webView = document.createElement('webview');
  window.document.body.appendChild(webView);
  webView.style.position = 'absolute';
  webView.src = fn;
  await new Promise((resolve, reject) => {
    let resolved = false;

    const done = () => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    };

    webView.addEventListener('did-finish-load', done);
    webView.addEventListener('did-fail-load', reject);
    setTimeout(done, 1000 * 5);
  });
  return webView;
}

function removeWebView(webView, delay = 30 * 60 * 1000) {
  setTimeout(() => window.document.body.removeChild(webView), delay);
}

function saveHTMLToTmp(html) {
  const fn = _path.default.join(require('os').tmpdir(), 'inkdrop-export.html');

  _fs.default.writeFileSync(fn, html, 'utf-8');

  return fn;
}