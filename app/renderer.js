const { remote } = require('electron');
const mainProcess = remote.require('./main');

var loginButton = document.getElementById('loginbutton');
loginButton.addEventListener('click', function () {
    var username = document.getElementById("Username").value;
    var pwd = document.getElementById("password").value;
    console.log(username,pwd);
    mainProcess.login(username,pwd);
});