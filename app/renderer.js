const { remote } = require('electron');
const mainProcess = remote.require('./main');

const openFileButton = document.getElementById('open-file');
const dropfileszone = document.getElementById('drop-zone');
var checkbox = document.querySelector('input[type="checkbox"]');

openFileButton.addEventListener('click', (e) => {
    e.preventDefault();
    mainProcess.getFileFromUser();
});

document.addEventListener('dragstart', event => event.preventDefault() );
document.addEventListener('dragover', event => event.preventDefault() );
document.addEventListener('dragleave', event => event.preventDefault() );
document.addEventListener('drop', event => event.preventDefault() );

dropfileszone.addEventListener('dragover', (event) => {
    dropfileszone.classList.add('drag-over');
});

dropfileszone.addEventListener('dragleave', (event) => {
    dropfileszone.classList.remove('drag-over');
});

dropfileszone.addEventListener('drop', (e) => {

    e.preventDefault();
    for (let f of e.dataTransfer.files) {
        console.log('File(s) you dragged here: ', f.path);
        mainProcess.getDraggedFileFromUser(f.path);
    }

    dropfileszone.classList.remove('drag-over');
});

checkbox.addEventListener('change', function () {
if (checkbox.checked) {
    console.log('Checked');
    mainProcess.watchdir();
} else {
    console.log('Not checked');
    mainProcess.stop();
}
});