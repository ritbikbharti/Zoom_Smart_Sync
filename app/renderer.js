const { remote } = require('electron');
const mainProcess = remote.require('./main');

var loginButton = document.getElementById('loginbutton');
var form = document.getElementById('form');
var state = document.getElementById('state');

if(loginButton) {
    loginButton.addEventListener('click', function (e) {
        e.preventDefault();
        var username = document.getElementById("Username").value;
        var pwd = document.getElementById("password").value;
        form.classList.add('loading');
        state.innerHTML = 'Authenticating';
        mainProcess.login(username,pwd);
    });
}