Util = function() {
    var self = this;
    self.fileSystem = require('fs-extra');
    self.dialog = require('electron').remote.dialog;
    self.tempStructure = [];
    self.tempRootPath = "";
    self.tempCounter = 0;

    /**
     * Generates a uuid based on the v1 protocol (time based)
     */
    self.generateUUID = function() {
        const v1 = require('uuid/v1');
        return v1();
    }

    /**
     * Generates a new uuid if the element is empty and returns it. If not, returns the element uuid
     * 
     * @param {Element} elementToValidate The element that should contain the current uuid
     */
    self.generateUUIDIfNeeded = function(elementToValidate) {
        if (elementToValidate.value === "") {
            return self.generateUUID();
        }

        return elementToValidate.value;
    }

    self.generatePathFromUuid = function(uuid) {
        return __appglobals.git_data_folders + uuid;
    }

    self.GetFolderStructure = function(uuid) {
        let startingPath = self.generatePathFromUuid(uuid);
        self.tempStructure = [];
        self.tempRootPath = startingPath;

        __readFolderStructure(startingPath);
        return self.tempStructure;
    }

    self.GetFolderStructureFromPath = function(path, treeStructure = false) {
        self.tempStructure = [];
        self.tempDictionary = [];
        self.tempRootPath = path;
        self.tempCounter = 0;

        if (treeStructure) {
            __readFolderStructureToTree(path);
        } else {
            __readFolderStructure(path);
        }

        return self.tempStructure;
    }

    self.CreateAppDataFolder = function(path) {
        self.fileSystem.ensureDirSync(path);
    }
    
    self.RemoveOlderGitClone = function(path) {
        self.fileSystem.remove(path, function(err) {
            console.log(err);
        });
    }

    self.openFolderDialog = function(elementSelectorID, callback) {
        self.dialog.showOpenDialog({properties: ['openDirectory']}, (folder) => {
            let elem = document.getElementById(elementSelectorID);
            elem.value = folder[0];

            if (callback) {
                callback(folder[0]);
            }
        });
    }

    function __readFolderStructure(path) {
        let dirOrFiles = self.fileSystem.readdirSync(path+"/");

        dirOrFiles.forEach((item) => {
            
            if (__appglobals.utils_exclusionfolder.find(f => f === item) != null) {
                return;
            }

            let obtainedPath = path+"/"+item;
            let addPath = obtainedPath.replace(self.tempRootPath+"/", "");

            if (self.fileSystem.statSync(obtainedPath).isDirectory()) {
                if (addPath.endsWith('.asar')) {    //In electron apps, the .asar file is recognized as a folder, on windows. This prevents it from happening
                    self.tempStructure.push({path: addPath, isFolder: false});
                } else {
                    self.tempStructure.push({path: addPath, isFolder: true});
                    __readFolderStructure(obtainedPath);
                }
                
            } else {
                
                self.tempStructure.push({path: addPath, isFolder: false});
            }
        })
    }

    function __readFolderStructureToTree(path) {
        let dirOrFiles = self.fileSystem.readdirSync(path+"/");

        dirOrFiles.forEach((item) => {
            if (__appglobals.utils_exclusionfolder.find(f => f === item) != null) {
                return;
            }

            self.tempCounter++;
            let obtainedPath = path+"/"+item;
            let addPath = obtainedPath.replace(self.tempRootPath+"/", "");

            if (self.fileSystem.statSync(obtainedPath).isDirectory()) {
                let item = {
                    id: self.tempCounter,
                    path: addPath,
                    isFolder: addPath.endsWith('.asar') ? false : true, //In electron apps, the .asar file is recognized as a folder, on windows. This prevents it from happening
                    files: new Array(),
                    folders: new Array(),
                    parentFolder: __pathWithoutLastItem(addPath)
                }

                let parent = self.tempDictionary.find(function(f) { return item.parentFolder === f.path });

                if (parent) {
                    item.parentid = parent.item.id;
                    parent.item.folders.push(item);

                } else {
                    item.parentid = 0;
                    self.tempStructure.push(item);

                }

                self.tempDictionary.push({ path: item.path, item: item} );    
                if (item.isFolder) {
                    __readFolderStructureToTree(obtainedPath);
                } 
                
            } else {
                let item = {
                    id: self.tempCounter,
                    path: addPath,
                    isFolder: false,
                    parentFolder: __pathWithoutLastItem(addPath)
                }
                
                let parent = self.tempDictionary.find(function(f) { return item.parentFolder === f.path});

                if (parent) {
                    item.parentid = parent.item.id;
                    parent.item.files.push(item);
                } else {
                    item.parentid = 0;
                    self.tempStructure.push(item);
                }
                
            }
        })
    }

    function __pathWithoutLastItem(path) {
        return path.substring(0, path.lastIndexOf('/'));
    }
    
    return self;
} 