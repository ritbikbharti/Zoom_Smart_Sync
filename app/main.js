const { app, BrowserWindow , Tray, Menu, dialog } = require('electron');
const fs = require('fs');
const req = require('request');
var chokidar = require("chokidar");
const nativeImage = require('electron').nativeImage
var path = require('path');
const {Notification} = require('electron');

let mainWindow = null;
let isQuiting;
let tray;

app.on('before-quit', function () {
  isQuiting = true;
});

app.on('ready', () => {
  tray = new Tray(nativeImage.createFromPath('C:/Users/Asus/Desktop/Electron App/icon.png'));

  tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: 'Show App', click: function () {
        mainWindow.show();
      }
    },
    {
      label: 'Quit', click: function () {
        isQuiting = true;
        app.quit();
      }
    }
  ]));

  mainWindow = new BrowserWindow({
    show: false,
    icon: 'icon.png',
    webPreferences: {
      nodeIntegration: true
    }
  });

  mainWindow.loadFile('index.html');
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', function (event) {
    if (!isQuiting) {
      event.preventDefault();
      mainWindow.hide();
      event.returnValue = false;
    }
  });

});

app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Select directory to watch for file changes
const watchdir = exports.watchdir = () => {
  dialog.showOpenDialog({
    properties: ['openDirectory'],
    buttonLabel: 'Watch This',
    title: 'Smart Sync Directory Selector'
  }).then(result => {
    console.log(result.filePaths[0])
    StartWatcher(result.filePaths[0])
  }).catch(err => {
    console.log(err)
  })
};

// Stop the currently running watcher
const StopWatcher = exports.StopWatcher = () => {
  watcher.close().then(() => console.log('Watcher is closed'));
};

// Function to select files using dialog box
const getFileFromUser = exports.getFileFromUser = () => {
  const files = dialog.showOpenDialog({
    properties: ['openFile','multiSelections'],
    buttonLabel: 'Upload',
    title: 'Smart Sync File Selector'
  });

  files.then(function(result){
    if(result.filePaths.length === 0)
      console.log("No Files Selected")
    for(var i in result.filePaths){
      console.log(result.filePaths[i]);
    }
  })

};

// Function to get files using drag and drop
const getDraggedFileFromUser = exports.getDraggedFileFromUser = filepath => {
  console.log(filepath)
  get_url(filepath);
};


// Function to get presigned url
function get_url(filepath) {
  var url = 'https://s3signedurlapi.herokuapp.com/getSignedUrl?name=';
  var filename = path.parse(filepath).base;
  console.log(filename);
  var URL = url.concat(filename)
  //GET Request -- gets the presigned url
  req.get(URL, function(err,res, body) {
    if (err) {
        return console.log(err);
    }
    console.log("Status code for GET SignedURL: ", res.statusCode);
    upload_files(body, filepath);     //URL is passed to upload function to give PUT Request to S3
  });
}


//Fucntion to PUT Request -- puts the object to AWS S3 Bucket
function upload_files(body, filepath) {
  fs.readFile(filepath, function(err, data){        //file is read from the system
      if(err){
        return console.log(err);
      }
      req({                       //PUT Request
        method: "PUT",
        url: body,
        body: data
      }, function(err, res, body){
        console.log(body);
        console.log("Status code for PUT Object: ", res.statusCode, "\n");
        callNotification("File uploaded successfully\n");
      })
    });
}

// DELETE Request -- deletes the specified object
function delete_files(filepath) {
  var url = 'https://s3signedurlapi.herokuapp.com/deleteObject?name=';
  var filename = path.parse(filepath).base;
  console.log(filename);
  var URL = url.concat(filename)

  req.del(URL, function(error,res,body) {
      if(error) {
          console.log(error);
      }else {
        console.log("Status code for Delete Object: ", res.statusCode);
        callNotification("File deleted successfully\n");
      }
  });
}

function StartWatcher(path){

  watcher = chokidar.watch(path, {
      ignored: /[\/\\]\./,
      persistent: true
  });

  function onWatcherReady(){
      //console.info('From here we can check for real changes, the initial scan has been completed.');
  }
        
  // Declare the listeners of the watcher
  watcher
  .on('add', function(path) {
        console.log('File', path, 'has been added');
        get_url(path);
  })
  .on('addDir', function(path) {
        console.log('Directory', path, 'has been added');
  })
  .on('change', function(path) {
       console.log('File', path, 'has been changed');
       get_url(path);
  })
  .on('unlink', function(path) {
       console.log('File', path, 'has been removed');
       delete_files(path);
  })
  .on('unlinkDir', function(path) {
       console.log('Directory', path, 'has been removed');
  })
  .on('error', function(error) {
       console.log('Error happened', error);
  })
  .on('ready', onWatcherReady)
  .on('raw', function(event, path, details) {
       // This event should be triggered everytime something happens.
       //console.log('Raw event info:', event, path, details);
  });
}

function callNotification(not){
  const notif={
        title: 'Zoom Smart Sync',
        body: not,
      };
  new Notification(notif).show();
}