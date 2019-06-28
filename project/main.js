const {app, BrowserWindow, ipcMain, globalShortcut, Menu} = require('electron')
const url = require('url') 
const path = require('path')

let win

function createWindow() { 
   win = new BrowserWindow({width: 1024, height: 768}) 
   win.loadURL(url.format ({ 
      pathname: path.join(__dirname, 'index.html'), 
      protocol: 'file:', 
      slashes: true 
   }))

   win.on('closed', function() {
       win = null;
   })

   globalShortcut.register('CmdOrCrtl+F5', function() {
       win.reload();
   })

   let template = [{
       label: 'Edit',
       submenu: [{
           label: 'Copy',
           accelerator: 'CmdOrCtrl+C',
           role: 'copy'
        },
        {
            label: 'Paste',
            accelerator: 'CmdOrCtrl+V',
            role: 'paste'
        },
        {
            label: 'Quit',
            accelerator: 'CmdOrCtrl+Q',
            role: 'quit'
        }]
   }]

   const menu = Menu.buildFromTemplate(template)
   Menu.setApplicationMenu(menu)
}

ipcMain.on('showDevTools', function() {
    win.webContents.openDevTools();
})

app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') {
        app.quit();
    }
})

app.on('activate', function() {
    if (win === null) {
        createWindow();
    }
})

app.on('ready', createWindow)