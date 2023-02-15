const vscode = require('vscode');
const fs = require('fs')
const path = require("path");
const utils = require('../utils/common')
var bulder = require('../lib/swagger-builder.js')


function readFile(filename, callback) {
	console.log('file name:', filename)
	bulder.SwaggerBuilder(filename, callback)
  }
async function generateJsApi(fileUri) {
    // The code you place here will be executed every time your command is executed

    // Display a message box to the user
    vscode.window.showInformationMessage('Hello World from swagger-generate-ts!');

     // fileUri为explorer选中的文件
    let proPath = "";
    let execPath = "";
    console.log("fileUri:",fileUri)
    //获取文本编辑器中打开的文件
    let tmpdir = vscode.window.activeTextEditor?.document.fileName;
    const fstat = fs.lstatSync(fileUri.path);
    if(fstat.isFile()){	
        tmpdir = fileUri.path;
    }
    if(tmpdir){
        let position = tmpdir.lastIndexOf('/');
        if(position>0){
            proPath = tmpdir.substring(0,position);
            execPath = tmpdir.substring(position+1);
        }
    }
    console.log('tmpdir:',tmpdir)
    let projectRoot = utils.getProjectRoot()
    let output = path.join(projectRoot,'/src/api/')
    console.log('output:',output)
    if(!fs.existsSync(output)){
        console.log('not exists')
        fs.mkdirSync(output,{ recursive: true } )
        vscode.window.showInformationMessage('create ',utils.getProjectRoot()+'/src/api', 'success');
    }

    readFile(tmpdir, (template) => {
        console.log('readFile')
        fs.writeFile(path.join(output,'swagger_api.js'), template, (error) => {
        console.log('writeFile')
        if (error) {
            console.error(error)
                throw error
            }
            vscode.window.showInformationMessage('build ' + tmpdir + ' to ' + path.join(output,'swagger_api.js') + ' success')
        })
    })

}

module.exports = {
    generateJsApi
}