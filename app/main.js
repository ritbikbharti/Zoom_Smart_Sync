const { app, BrowserWindow , Tray, Menu, dialog, crashReporter, Notification, shell } = require('electron');
const fs = require('fs');
const req = require('request');
var chokidar = require("chokidar");
const nativeImage = require('electron').nativeImage
var path = require('path');
const osenv = require('osenv');
const Store = require('electron-store');
const store = new Store();

let lawfirm = store.get('lawfirm');
const home = osenv.home();
let appdir;
const length = home.length+9

var currDir, currDir1, currDirPath;

let mainWindow = null;
let child;
let isQuiting;
let tray;

var showInLogFlag = false;

function quitApplication(app){
  const options = {
    type: 'info',
    message: 'Wait!...Saving and Exiting....'
  };
  dialog.showMessageBox(null, options);
  setTimeout( function(){
    if (tray) tray.destroy()
    app.quit();
  }, 3000 );
}

const returnFirmName = exports.returnFirmName = () => {
  return store.get('lawfirm');
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

//Saves file history to old.txt
function saveFileHistory() {
  if(fs.existsSync('old.txt')) {
    fs.unlinkSync('old.txt'); //Delete any existing old file log
  }
  //This sets up the file history recorder
  var walk    = require('walk');
  var files   = [];

  // Walker options
  var walker  = walk.walk(appdir, { followLinks: false });

  walker.on('file', function(root, stat, next) {
      // Add this file to the list of files
      let temp = root + '/' + stat.name;
      files.push(temp.replace(/\\/g, "/"));
      next();
  });

  walker.on('end', function() {
      console.log(files);
      for (file of files) {
        fs.appendFileSync('old.txt', file+'\n', 'utf8');
      }
  });
}


//electron application code
app.on('before-quit', function () {
  isQuiting = true;
});

app.on('ready', () => {

  crashReporter.start({
    productName: lawfirm,
    companyName: 'INSZoom',
    submitURL: 'https://zoomsmartsync.herokuapp.com/api/app-crash',
    uploadToServer: true
  })

  tray = new Tray(nativeImage.createFromPath('C:/Users/Asus/Documents/Minor Project/Zoom Smart Sync v3/icon.png'));

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
        saveFileHistory();
        quitApplication(app);
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
          label: 'Logout',
          click : function(){
            store.delete('lawfirm');
            isQuiting = true;
            saveFileHistory();
            quitApplication(app);
          }
        },
        {
          label: 'Quit', click: function () {
            isQuiting = true;
            saveFileHistory();
            quitApplication(app);
          }
        }
      ]
    },
    {
      label: 'Help',
      click: function(){
        shell.openExternal('mailto:ritbikbharti@gmail.com?Subject=Smart%20Sync%20App%20Help')
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

  mainWindow.webContents.on('unresponsive', () => {
    const options = {
      type: 'info',
      title: 'Application Crashed',
      message: 'The application has crashed.',
      buttons: ['Reload','Close']
    }

    dialog.showMessageBox(null, options, (index) => {
      if (index === 0) app.relaunch()
      else app.quit()
    })
  })

  mainWindow.loadFile('home.html');

  //mainWindow.webContents.openDevTools()

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

  //child.webContents.openDevTools()

  child.once('ready-to-show', () => {
    if(store.get('lawfirm')==undefined){
      child.show();
    }
    else{
      lawfirm = store.get('lawfirm');
      appdir = home+"/Desktop/"+lawfirm;
      mainWindow.webContents.send('load');
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


//login function
const login = exports.login = (username,pwd) => {

  var url = 'https://zoomsmartsync.herokuapp.com/api/verifyUser?name=';
  var url = url.concat(username);
  var url = url.concat('&pwd=');
  var URL  = url.concat(pwd);
  req.get(URL, function(err,res,body) {
    if (err) {
        return console.log(err);
    }
    if(res.statusCode == '200'){
      store.set('lawfirm',username)
      lawfirm = username;
      appdir = home+"/Desktop/"+lawfirm;
      mainWindow.show();
      child.hide();
      var folderstr = body;
      var folders = folderstr.split('/');
      fs.mkdir(home+"/Desktop/"+username, { recursive: true }, (err) => { if (err) throw err; });
      var x;
      for(x in folders){
        var fld = home+"/Desktop/"+username.concat("/");
        var fld = fld.concat(folders[x]);
        fs.mkdir(fld, { recursive: true }, (err) => { if (err) throw err; });
      }
      mainWindow.webContents.send('load');
      const options = {
        type: 'info',
        message: 'Welcome! You are now logged in.'
      };
      dialog.showMessageBox(null, options);
    }
    else{
      const options = {
        type: 'info',
        message: 'Incorrect username or password! Please Check.'
      };
      dialog.showMessageBox(null, options);
      child.reload();
    }
  });
};



app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (tray) tray.destroy()
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

  //This sets up the file history recorder
  var walk    = require('walk');
  var files   = [];

  // Walker options
  var walker  = walk.walk(appdir, { followLinks: false });

  walker.on('file', function(root, stat, next) {
      // Add this file to the list of files
      let temp = root + '/' + stat.name;
      files.push(temp.replace(/\\/g, "/"));
      next();
  });

  walker.on('end', function() {
      console.log("\nNew files");
      console.log(files);

      if(fs.existsSync('old.txt')) {
        var array = fs.readFileSync('old.txt', 'utf8').toString().split('\n');
        console.log("\nOld.txt");
        console.log(array);

        //array has list of old files
        var countold = 0;
        for(var i=0;i<array.length-1;i++){
          if(files.indexOf(array[i]) == -1){
            console.log("This file has been deleted: "+array[i]);
            countold++;
            delete_files(array[i],9);
          }
        }
        var countnew = 0;
        for(var k=0;k<files.length;k++){
          if(array.indexOf(files[k]) == -1){
            console.log("This file has been added: "+files[k]);
            countnew++;
            get_urlwatcher(files[k],9);
          }
        }
        if(countnew>0 && countold>0) callNotification(countnew +" files have been added\n" + countold +" files have been deleted\n");
        else if(countnew>0 && countold<=0) callNotification(countold +" files have been added\n");
        else if(countold>0 && countnew<=0) callNotification(countold +" files have been deleted\n");
        fs.unlinkSync('old.txt');
      }

      console.log("Watcher started on : "+appdir);
      //start the watcher
      StartWatcher(appdir);

  });

};

// Stop the currently running watcher
const StopWatcher = exports.StopWatcher = () => {
  saveFileHistory();
  showInLogFlag = false;
  watcher.close().then(() => console.log('Watcher is closed'));
};

// Function to get files using drag and drop
const getDraggedFileFromUser = exports.getDraggedFileFromUser = filepath => {
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
  mainWindow.webContents.send('refresh');
}


// Function to get presigned url
function get_url(filepath) {
  var url = 'https://zoomsmartsync.herokuapp.com/api/getSignedUrl?name=';
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
function get_urlwatcher(filepath, num) {
  var url = 'https://zoomsmartsync.herokuapp.com/api/getSignedUrl?name=';
  var filename = path.parse(filepath).base;
  console.log(filename);
  var URL = url.concat(filepath.substr(length,filepath.length))
  var URL = URL.replace(/\\/g, "/");
  console.log(URL);
  //GET Request -- gets the presigned url
  req.get(URL, function(err,res, body) {
    if (err) {
        return console.log(err);
    }
    console.log("Status code for GET SignedURL: ", res.statusCode);
    upload_sync_files(body, filepath, num);     //URL is passed to upload function to give PUT Request to S3
  });
}

//Function to PUT Request -- puts the object to AWS S3 Bucket
function upload_sync_files(body, filepath, num) {
  fs.readFile(filepath, function(err, data){        //file is read from the system
      if(err){
        return console.log(err);
      }
      req({                       //PUT Request
        method: "PUT",
        url: body,
        body: data
      }, function(err, res, body){
        if (err) {
          return console.log(err);
        }
        console.log("Status code for PUT Object: ", res.statusCode, "\n");
        if(num!=9){
          callNotification("Files synced successfully\n");
        }
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
        if (err) {
          return console.log(err);
        }
        console.log("Status code for PUT Object: ", res.statusCode, "\n");
        callNotification("File uploaded successfully\n");
      })
    });
}

// DELETE Request -- deletes the specified object
function delete_files(filepath, num) {
  var url = 'https://zoomsmartsync.herokuapp.com/api/deleteObject?name=';
  var filename = path.parse(filepath).base;
  var URL = url.concat(filepath.substr(length,filepath.length))
  //var URL = URL.concat("/"+filename)
  var URL = URL.replace(/\\/g, "/");

  req.del(URL, function(error,res,body) {
      if(error) {
          console.log(error);
      }else {
        console.log("Status code for Delete Object: ", res.statusCode);
        if(num!=9){
          callNotification("File deleted successfully\n");
        }
      }
  });
}

function StartWatcher(path){

  watcher = chokidar.watch(path, {
      ignored: /[\/\\]\./,
      persistent: true
  });

  function onWatcherReady(){
      console.info('From here we can check for real changes, the initial scan has been completed.');
      showInLogFlag = true;
  }
        
  // Declare the listeners of the watcher
  watcher
  .on('add', function(path) {

        if(showInLogFlag){
          console.log('File', path, 'has been added');
          get_urlwatcher(path);
        }
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
        icon: nativeImage.createFromPath('C:/Users/Asus/Documents/Minor Project/Zoom Smart Sync v3/icon.png')
      };
  new Notification(notif).show();
}