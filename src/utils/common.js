const vscode = require('vscode');

function getProjectRoot() {
    if (!vscode.workspace.workspaceFolders?.length) {
      return __dirname;
    }
    return vscode.workspace.workspaceFolders[0].uri.fsPath;
  }

module.exports = {
	getProjectRoot,
}