"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addTitleToMarkdown = addTitleToMarkdown;

function addTitleToMarkdown(md, title) {
  let frontmatter = '';
  let body = md;
  const match = md.match(/^---\n.*?---/ms);

  if (match instanceof Array && match.length > 0 && match.index === 0) {
    frontmatter = match[0];
    body = md.substr(frontmatter.length).trimLeft();
  }

  const linebreaks = body.split('\n', 1)[0].length === 0 ? '\n' : '\n\n';
  return frontmatter.length > 0 ? `${frontmatter}\n# ${title}${linebreaks}${body}` : `# ${title}${linebreaks}${md}`;
}