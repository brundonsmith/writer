
// Electron entry point

const { app, BrowserWindow, ipcMain } = require('electron')

function createWindow () {
  // Create the browser window.
  const win = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true
    }
  })

  win.maximize();
  win.webContents.openDevTools()

  // and load the index.html of the app.
  win.loadFile('dist/index.html')
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

const fs = require('fs')
const path = require('path')

// TODO: Prompt for this and remember it between openings
const WORKSPACE = `/Users/brundolf/notes`

ipcMain.on('list-documents', (event) => {  
  fs.readdir(path.resolve(WORKSPACE), (err, files) =>
    event.reply('list-documents', JSON.stringify(
      files.map(fileName =>
        ({
          name: fileName,
          time: fs.statSync(path.resolve(WORKSPACE) + '/' + fileName).mtime.getTime()
        }))
      .sort((a, b) => b.time - a.time)
      .map(v => v.name))))

})

ipcMain.on('load-document', (event, doc) => {  
  fs.readFile(path.resolve(WORKSPACE, doc), 'utf8', (err, file) =>
    event.reply('load-document', file || ''))
})

ipcMain.on('save-document', (event, previousName, newName, body) => {
  if(previousName) {
    fs.renameSync(path.resolve(WORKSPACE, previousName), path.resolve(WORKSPACE, newName));
  }

  fs.writeFile(path.resolve(WORKSPACE, newName), body, () => event.reply('save-document'))
})