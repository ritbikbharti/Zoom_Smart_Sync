const { app, BrowserWindow , Tray, Menu, dialog, ipcMain, crashReporter, Notification, shell } = require('electron');
const fs = require('fs');
const req = require('request');
var chokidar = require("chokidar");
const nativeImage = require('electron').nativeImage
var path = require('path');
const osenv = require('osenv');
const Store = require('electron-store');
const store = new Store();

let lawfirm = store.get('lawfirm');
const home =  osenv.home();
const appdir = home+"/Desktop/"+lawfirm;
const length = home.length+9

var currDir, currDir1, currDirPath;

let mainWindow = null;
let child;
let isQuiting;
let tray;

const returnFirmName = exports.returnFirmName = () => {
  return lawfirm;
};

//path of current directory shown in user interface
const returnDirPath = exports.returnDirPath = filepath => {
  currDirPath = filepath;
  console.log("Curr dir path: "+currDirPath);
};

//current directory shown in user interface
const returnDir = exports.returnDir = filepath => {
  currDir1 = filepath.substr(length,filepath.length)
  currDir = currDir1.replace(/\\/g, "/");
  console.log("Current dir : "+currDir)
};

const dir = exports.dir = () => {
  return currDir;
}


app.on('before-quit', function () {
  isQuiting = true;
});

app.on('ready', () => {

  crashReporter.start({
    productName: lawfirm,
    companyName: 'INSZoom',
    submitURL: 'https://your-domain.com/url-to-submit',
  uploadToServer: false
  })

  tray = new Tray(nativeImage.createFromPath('C:/Users/Asus/Desktop/Electron App/icon.png'));

  tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: 'Show App', click: function () {
        if(store.get('lawfirm')!=undefined){
          mainWindow.show();
        }
      }
    },
    {
      label: 'Quit', click: function () {
        isQuiting = true;
        app.quit();
      }
    }
  ]));

  const template = [
    {
      label: 'Menu',
      submenu: [
        {
          label: 'About Us',
          click: function(){
            shell.openExternal('https://inszoom.com');
          }
        },
        {
          label: 'Report Crash/Error',
          click : function(){
            shell.openExternal('mailto:ritbikbharti@gmail.com?Subject=Error%20Log%20File')
          }
        }
      ]
    },
    {
      label: 'Help',
      click: function(){
        shell.openExternal('https://inszoom.com')
      }
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  mainWindow = new BrowserWindow({
    show: false,
    icon: 'icon.png',
    webPreferences: {
      nodeIntegration: true
    }
  });

  mainWindow.loadFile('home.html');

  child = new BrowserWindow({
    parent: mainWindow,
    width:400,
    height:550,
    frame:false,
    show:false,
    webPreferences: {
      nodeIntegration: true
    }
  });

  child.loadFile('login.html');

  child.once('ready-to-show', () => {
    //store.delete('lawfirm');                          //Delete the saved configuration
    if(store.get('lawfirm')==undefined){
      child.show();
    }
    else{
      lawfirm = store.get('lawfirm');
      mainWindow.show();
    }
  });

  mainWindow.on('close', function (event) {
    if (!isQuiting) {
      event.preventDefault();
      mainWindow.hide();
      event.returnValue = false;
    }
  });

});

const login = exports.login = (username,pwd) => {

  var url = 'https://s3signedurlapi.herokuapp.com/verifyUser?name=';
  var url = url.concat(username);
  var url = url.concat('&pwd=');
  var URL  = url.concat(pwd);
  req.get(URL, function(err,res,body) {
    if (err) {
        return console.log(err);
    }
    if(res.statusCode == '200'){
      var folderstr = body;
      var folders = folderstr.split('/');
      fs.mkdir(appdir, { recursive: true }, (err) => { if (err) throw err; });
      var x;
      for(x in folders){
        var fld = appdir.concat("/");
        var fld = fld.concat(folders[x]);
        fs.mkdir(fld, { recursive: true }, (err) => { if (err) throw err; });
      }
      store.set('lawfirm',username)
      lawfirm = username;
      mainWindow.show();
      child.hide();
    }
    else{
      const options = {
        type: 'info',
        message: 'Incorrect username or password! Please Check.'
      };
      dialog.showMessageBox(null, options);
    }
  });
};



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
  console.log(appdir);
  StartWatcher(appdir);
};

// Stop the currently running watcher
const StopWatcher = exports.StopWatcher = () => {
  watcher.close().then(() => console.log('Watcher is closed'));
};

/*
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
*/

// Function to get files using drag and drop
const getDraggedFileFromUser = exports.getDraggedFileFromUser = filepath => {
  //console.log(app.getPath('userData'))
  console.log("Path of dragged file : "+filepath)
  console.log("Current Directory : "+currDir)
  copyFile(filepath,currDirPath);
  get_url(filepath);
};

//Function to copy the file dragged in UI
function copyFile(filepath, currDirPath) {
  var filename = path.parse(filepath).base;
  currDirPath = currDirPath.concat("/"+filename)
  fs.copyFile(filepath, currDirPath, (err) => {
    if (err) throw err;
    console.log('source file was copied to destination folder');
  });
}


// Function to get presigned url
function get_url(filepath) {
  var url = 'https://s3signedurlapi.herokuapp.com/getSignedUrl?name=';
  var filename = path.parse(filepath).base;
  console.log(filename);
  var URL = url.concat(currDir)
  var URL = URL.concat("/"+filename)
  //GET Request -- gets the presigned url
  req.get(URL, function(err,res, body) {
    if (err) {
        return console.log(err);
    }
    console.log("Status code for GET SignedURL: ", res.statusCode);
    upload_files(body, filepath);     //URL is passed to upload function to give PUT Request to S3
  });
}

// Function to get presigned url for watcher
function get_urlwatcher(filepath) {
  var url = 'https://s3signedurlapi.herokuapp.com/getSignedUrl?name=';
  var filename = path.parse(filepath).base;
  console.log(filename);
  var URL = url.concat(filepath.substr(length,filepath.length))
  //var URL = URL.concat("/"+filename)
  var URL = URL.replace(/\\/g, "/");
  console.log(URL);
  //GET Request -- gets the presigned url
  req.get(URL, function(err,res, body) {
    if (err) {
        return console.log(err);
    }
    console.log("Status code for GET SignedURL: ", res.statusCode);
    upload_sync_files(body, filepath);     //URL is passed to upload function to give PUT Request to S3
  });
}

//Function to PUT Request -- puts the object to AWS S3 Bucket
function upload_sync_files(body, filepath) {
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
        callNotification("Files synced successfully\n");
      })
    });
}


//Function to PUT Request -- puts the object to AWS S3 Bucket
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
  //console.log(filename);
  var URL = url.concat(filepath.substr(length,filepath.length))
  //var URL = URL.concat("/"+filename)
  var URL = URL.replace(/\\/g, "/");

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
        get_urlwatcher(path);
  })
  .on('addDir', function(path) {
        console.log('Directory', path, 'has been added');
  })
  .on('change', function(path) {
       console.log('File', path, 'has been changed');
       get_urlwatcher(path);
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
        icon: nativeImage.createFromPath('C:/Users/Asus/Desktop/Electron App/icon.png')
      };
  new Notification(notif).show();
}