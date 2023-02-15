const vscode = require('vscode');
const fs = require('fs')
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
    let output = utils.getProjectRoot()+'/src/api/swagger_api.js'
    console.log('output:',output)

    readFile(tmpdir, (template) => {
        console.log('readFile')
        fs.writeFile(output, template, (error) => {
        console.log('writeFile')
        if (error) {
            console.error(error)
                throw error
            }
            console.log('build ' + tmpdir + ' to ' + output + ' success')
        })
    })

}

module.exports = {
    generateJsApi
}