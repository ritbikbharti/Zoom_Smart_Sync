'use strict';
const { remote } = require('electron');
const mainProcess = remote.require('./main');

let document;
const fileSystem = require('./filesystem');
const path = require('path');

var currdir;
var CurrFolder;
var prevdir;

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
  mainProcess.returnDir(currdir);
  mainProcess.returnDirPath(currdir);
  displayFolderPath();

  return function (window) {
    if (!document) document = window.document;
    fileSystem.getFilesInFolder(folderPath, (err, files) => {
      clearView();
      if (err) {
        console.log(err);
        //return alert('Sorry, we could not load your folder');
      }
      fileSystem.inspectAndDescribeFiles(folderPath, files, displayFiles);
    });
  };
}

function displayFile(file) {
  const mainArea = document.getElementById('main-area');
  const template = document.querySelector('#item-template');
  //
  //var menuDisplayed = false;
  //var menuBox = null;
  //
  let clone = document.importNode(template.content, true);
  clone.querySelector('img').src = `images/${file.type}.svg`;
  clone.querySelector('img').setAttribute('data-filePath', file.path);
  /*window.document.addEventListener("click", function() {
    if(menuDisplayed == true){
        menuBox.style.display = "none";
    }
  }, true);*/

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
    /*clone.querySelector('img')
   		.addEventListener('contextmenu', (e) => {
        var left = arguments[0].clientX;
        var top = arguments[0].clientY;
        
        menuBox = window.document.querySelector(".menu");
        menuBox.style.left = left + "px";
        menuBox.style.top = top + "px";
        menuBox.style.display = "block";
        
        arguments[0].preventDefault();
        
        menuDisplayed = true;
   		},
		false);*/
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
  if(mainProcess.returnFirmName() != mainProcess.dir()){
    loadDirectory(prevdir)();
  }
}

function refreshh() {
  loadDirectory(currdir)();
}

module.exports = { bindDocument, displayFiles, loadDirectory, bindSearchField, filterResults, resetFilter, goBack, refreshh};
