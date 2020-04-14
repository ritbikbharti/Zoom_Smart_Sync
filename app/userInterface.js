'use strict';
const { remote } = require('electron');
const mainProcess = remote.require('./main');

let document;
const fileSystem = require('./fileSystem');
//const search = require('./search');
const path = require('path');

var currdir;
var CurrFolder;
var prevdir;
var prevdirfolder;
var prev2prevdir;
var prev2prevdirfolder;

var folder, folder2, folder3;

function displayFolderPath(folderPath) {
  document.getElementById('firmname').innerHTML = mainProcess.dir();
}

function clearView() {
  const mainArea = document.getElementById('main-area');
  let firstChild = mainArea.firstChild;
  while (firstChild) {
    mainArea.removeChild(firstChild);
    firstChild = mainArea.firstChild;
  }
}

function loadDirectory(folderPath) {
  currdir = folderPath;
  
  CurrFolder = path.basename(folderPath)
  prevdir = path.dirname(folderPath)
  /*
  prevdirfolder = path.basename(prevdir)
  prev2prevdir = path.dirname(prevdir)
  prev2prevdirfolder = path.basename(prev2prevdir)
  console.log("Current dir : "+currdir);
  console.log("Current folder : "+CurrFolder);
  console.log("Prev dir : "+prevdir);
  console.log("Prev dir folder : ", prevdirfolder);
  console.log("Prev2prev dir : "+prev2prevdir);
  console.log("Prev2prev dir folder : ", prev2prevdirfolder);

  console.log("logging from userInterface"+prevdirfolder);
  folder = prevdirfolder.concat("/");
  folder2 = folder.concat(CurrFolder);
  folder3 = folder2.concat("/");*/
  mainProcess.returnDir(currdir);
  displayFolderPath();

  return function (window) {
    if (!document) document = window.document;
		//search.resetIndex();
    fileSystem.getFilesInFolder(folderPath, (err, files) => {
      clearView();
      if (err) {
        return alert('Sorry, we could not load your folder');
      }
      fileSystem.inspectAndDescribeFiles(folderPath, files, displayFiles);
    });
  };
}

function displayFile(file) {
  const mainArea = document.getElementById('main-area');
  const template = document.querySelector('#item-template');
  let clone = document.importNode(template.content, true);
  //search.addToIndex(file);
  clone.querySelector('img').src = `images/${file.type}.svg`;
  clone.querySelector('img').setAttribute('data-filePath', file.path);
  if (file.type === 'directory') {
    clone.querySelector('img')
      .addEventListener('dblclick', () => {
        loadDirectory(file.path)();
      }, false);
		} else {
 		clone.querySelector('img')
   		.addEventListener('dblclick', () => {
        fileSystem.openFile(file.path);
   		},
		false);
	}
  clone.querySelector('.filename').innerText = file.file;
  mainArea.appendChild(clone);
}


function displayFiles(err, files) {
  if (err) {
    return alert('Sorry, we could not display your files');
  }
  files.forEach(displayFile);
}

function bindDocument (window) {
  if (!document) {
    document = window.document;
  }
}

function bindSearchField(cb) {
  document.getElementById('search').addEventListener('keyup', cb, false);
}

function filterResults(results) {
  const validFilePaths = results.map((result) => { return result.ref; });
  const items = document.getElementsByClassName('item');
  for (var i = 0; i < items.length; i++) {
    let item = items[i];
    let filePath = item.getElementsByTagName('img')[0]
      .getAttribute('data-filepath');
    if (validFilePaths.indexOf(filePath) !== -1) {
      item.style = null;
    } else {
      item.style = 'display:none;';
    }
  }
}

function resetFilter() {
  const items = document.getElementsByClassName('item');
  for (var i = 0; i < items.length; i++) {
    items[i].style = null;
  }
}

function goBack() {
  console.log("hello");
  loadDirectory(prevdir)();
}

module.exports = { bindDocument, displayFiles, loadDirectory, bindSearchField, filterResults, resetFilter, goBack};
