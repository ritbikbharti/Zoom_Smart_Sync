'use strict';

const fileSystem = require('./fileSystem');
const userInterface = require('./userInterface');

function main() {
  userInterface.bindDocument(window);
  let folderPath = fileSystem.getUsersHomeFolder();
  userInterface.loadDirectory(folderPath)(window);
  userInterface.bindSearchField((event) => {
    const query = event.target.value;
    if (query === '') {
      userInterface.resetFilter();
    } else {
      search.find(query, userInterface.filterResults);
    }
  });
}

function callback(){
  console.log("back button pressed");
  userInterface.goBack();
}

function refresh(){
  console.log("refresh button pressed");
  userInterface.refreshh();
}

window.onload = main;
