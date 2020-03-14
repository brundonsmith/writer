
// Electron entry point
const fs = require('fs')
const path = require('path')
const { app, BrowserWindow, ipcMain, dialog } = require('electron')



// window setup
function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true
    }
  })

  win.maximize();
  //win.webContents.openDevTools()

  // and load the index.html of the app.
  win.loadFile('./index.html')
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow)

// Quit when all windows are closed.
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



// documents workspace
let workspace = ``;
const selectDirectory = () => 
  dialog.showOpenDialog({ 
      title: 'Select a directory for your writings', 
      message: 'Select a directory for your writings', 
      properties: ['openDirectory', 'createDirectory'] 
    })
    .then(res => workspace = res.filePaths[0])



// commands exposed to the UI

ipcMain.on('list-documents', (event) => {  
  fs.readdir(path.resolve(workspace), (err, files) =>
    event.reply('list-documents', JSON.stringify(
      files.map(fileName =>
        ({
          name: fileName,
          time: fs.statSync(path.resolve(workspace) + '/' + fileName).mtime.getTime()
        }))
      .sort((a, b) => b.time - a.time)
      .map(v => v.name))))

})

ipcMain.on('load-document', (event, doc) => {  
  fs.readFile(path.resolve(workspace, doc), 'utf8', (err, file) =>
    event.reply('load-document', file || ''))
})

ipcMain.on('save-document', (event, previousName, newName, body) => {
  const previousPath = path.resolve(workspace, previousName ?? '');
  const newPath = path.resolve(workspace, newName);

  if(!body) {
    fs.unlinkSync(previousPath);
    event.reply('save-document');
  } else {
    if(previousName) {
      fs.renameSync(previousPath, newPath);
    }

    fs.writeFile(newPath, body, () => event.reply('save-document'));
  }
})

ipcMain.on('select-directory', (event) => 
  selectDirectory()
    .then(() => event.reply('select-directory')))
