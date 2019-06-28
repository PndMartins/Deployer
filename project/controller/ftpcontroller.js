class FtpController extends Base {

    constructor() {
        super();

        this.client = null;
        this.sftp = null;
    }

    // Helpers ----------------------------------------------------------------------------------------------------------------------------------

    /**
     * Reads the config form for the connection properties and generates an object with the information
     */
    __get_con_info_object() {
        return {
            host: document.getElementById(__appglobals.form_serverconf_server).value,
            port: document.getElementById(__appglobals.form_serverconf_port).value,
            username: document.getElementById(__appglobals.form_serverconf_username).value,
            password: document.getElementById(__appglobals.form_serverconf_password).value,
            keepaliveCountMax: 1,
            readyTimeout: 3000
        }
    }

    /**
     * Generates a connection object from a given server config object
     * 
     * @param {Config} config The object to use
     */
    __get_con_info_object_from_config(config) {
        return {
            host: config.server,
            port: config.port,
            username: config.username,
            password: config.password,
            keepaliveCountMax: 1,
            readyTimeout: 3000
        }
    }

    /**
     * Applies an error message to the elements that contain an error in the connection form
     * 
     * @param {String} err The error message 
     */
    __set_error_objects(err, hostOnly) {
        //Applies the error to the host element
        let hostElement = document.getElementById(__appglobals.form_serverconf_server);
        validationcontroller.EnforceError(false, false, hostElement, true, err, this);

        if (hostOnly) {
            return;
        } 
        
        //Applies the error to the remaining elements
        let portElement = document.getElementById(__appglobals.form_serverconf_port);
        let usernameElement = document.getElementById(__appglobals.form_serverconf_username);
        let passwordElement = document.getElementById(__appglobals.form_serverconf_password);

        validationcontroller.EnforceError(false, false, hostElement, true, err, this);
        validationcontroller.EnforceError(false, false, portElement, false, err, this);
        validationcontroller.EnforceError(false, false, usernameElement, false, err, this);
        validationcontroller.EnforceError(false, false, passwordElement, false, err, this);
    }

    _normalizeDate(string) {
        return string.replace(/[/]/g,"-");
    }

    _denormalizeDate(string) {
        return string.replace(/[-]/g,"/");
    }

    _normalizeTime(string) {
        return string.replace(/[:]/g,"-");
    }

    _denormalizeTime(string) {
        return string.replace(/[-]/g,":");
    }

    // -----------------------------------------------------------------------------------------------------------------------------------------

    // Common Ftp calls ------------------------------------------------------------------------------------------------------------------------

    /**
     * Trie 2 testes. First pings the server, if the server replies to the ping, it attemps to connect via ssh. If the testes fails,
     * it applies an error message to the elements that contain this options
     */

    TesteConnection() {
        applog.LogInfo("Trying to ping the server");

        let host = document.getElementById(__appglobals.form_serverconf_server).value;
        let pingObj = require("ping");

        pingObj.sys.probe(host, function(responded) {
            if (!responded) {
                applog.LogError("Ping failed. Unless this machine is configured to not respond to a Ping, the machine is unavailable.")
                ftpcontroller.__set_error_objects("The host is not available. A ping falied to reach the host", true);
                return;

            } else  {
                applog.LogSuccess("Ping sucessfull. Trying to connect via ssh");

                let conInfo = ftpcontroller.__get_con_info_object();
                let con = new require("ssh2").Client();

                con.on('ready', function() {
                    applog.LogSuccess("Connection sucessfull.")
                    applog.LogInfo("Closing connection");
                    con.end();
                    
        
                }).on('error', function(err) {
                    applog.LogWarning("Ping was successfull but the machine is not allowing an ssh connection. Either you tried to many times or the authentication information is wrong");
                    ftpcontroller.__set_error_objects(err);
                    con.end();
                    console.log("An error has occoured: " + err);
        
                }).on('end', function() {
                    applog.LogInfo("Connection closed");
                    applog.LogInfo("Validation complete");
        
                })
                .connect(conInfo);
            } 
        })
    }

    /**
     * Ensures that the callbacks will be associated correctly (Need to rethink this but, for now, it works. It should not be needed to create the variable again)
     */
    _reset() {
        this.client = new require("ssh2").Client();
        this.sftp = null;
        this.completeProcessCallBack = null;
    }

    /**
     * Starts an Ftp connection to the server
     * 
     * @param {Object} serverConfig The object that contains all of the server configurations
     * @param {Function} dispatcherCallback The callback to call, when the process is complete
     */
    _StartFtpConnection(serverConfig, dispatcherCallback) {
        //Resets all previous connections
        ftpcontroller._reset();

        let conInfo = ftpcontroller.__get_con_info_object_from_config(serverConfig);
        let cb = dispatcherCallback;

        ftpcontroller.client.on('ready', function() {
            applog.LogInfo("Connected to the server.");
            cb();
        })
        .on('error', ftpcontroller._FtpError)
        .on('end', ftpcontroller._EndFtpConnection)
        .connect(conInfo);
    }

    /**
     * Generates a new sftp object for the current session (needs an open connection)
     * 
     * @param {Function} dispatcherCallback The callback to call when the process is complete
     */
    _StartSftp(dispatcherCallback) {
        ftpcontroller.client.sftp(function(err, sftp) {
            ftpcontroller.sftp = sftp;
            dispatcherCallback();
        });
    }

    /**
     * Terminates the current ftp connnection on the server
     */
    _StopFtpConnection(dispatcherCallback) {
        ftpcontroller.client.end();
        dispatcherCallback();
    }

    /**
     * This method must be associated to the ftp error event, to ensure a logging of the error happens and the
     * server connection does not get stuck by disconnecting the current connection
     * 
     * @param {String} err The error found
     */
    _FtpError(err) {
        applog.LogError(err);
        ftpcontroller.client.end();
    }

    /**
     * This method should be associated to the ftc disconect event, to pass a message into the console that the server was disconnected
     */
    _EndFtpConnection() {
        applog.LogInfo("Server disconnected");
    }

    /**
     * Creates a folder on a linux remote machine
     * 
     * @param {String} path The path of the folder to create
     * @param {Function} dispatcherCallback The function to call when this is complete
     */
    _FtpCreateFolder(path, dispatcherCallback) {
        ftpcontroller.sftp.mkdir(path, function(err) {
            if (err) {
                if (err.code != 4) {
                    applog.LogError("Folder error: " + err);

                } else {
                    applog.LogWarning("Folder already exists, ignoring: " + path);

                }
            } else {
                applog.LogInfo("Folder created: " + path);

            }
            dispatcherCallback();
        })
    }

    /**
     * Uploads a file onto a linux remote machine
     * 
     * @param {String} localPath The complete path to the local file to upload
     * @param {String} remotePath The complete path where the file should be placed in the remote machine
     * @param {Function} dispatcherCallback The function to call when this is process is complete
     */
    _FtpUploadFile(localPath, remotePath, dispatcherCallback) {
        ftpcontroller.sftp.fastPut(localPath, remotePath, {}, function(err) {
            if (err) {
                applog.LogError("File error: " + err + "| Path: " + remotePath);
            } else {
                applog.LogInfo("File created: " + remotePath);
            }

            dispatcherCallback();
        });
    }

    // -----------------------------------------------------------------------------------------------------------------------------------------

    /**
     * Creates the folder that will hold the backups on the server. (usually, on linux, it should be /etc/opt/{appname})
     * 
     * @param {String} folderPath The path where the backup folder should be created
     * @param {Function} machineCallbak The method to call back when the process is finished
     */
    _CreateBackupFolder(folderPath, serverid, machineCallbak) {
        let backupRoot = folderPath;
        let backupFolder = backupRoot + "/" + serverid;

        let mcb = machineCallbak;

        //Checks if the backup root folder exist 
        ftpcontroller.sftp.stat(backupRoot, function(err, stats) {
            if (err) {  //if it does not exist, creates it and creates the server id folder
                if (err.code == 2) {
                    ftpcontroller.sftp.mkdir(backupRoot, function (err) {
                        ftpcontroller.sftp.mkdir(backupFolder, function(err) {
                            mcb();
                        });
                    });
                }
            } else {
                //If exists, checks if the server id folder exists
                ftpcontroller.sftp.stat(backupFolder, function(err, stats) {
                    if (err) {  //If if does not exist, creates it
                        if (err.code == 2) {
                            ftpcontroller.sftp.mkdir(backupFolder, function(err) {
                                mcb();
                            });
                        }
                    } else {
                        let bckFolder = backupFolder;

                        ftpcontroller.sftp.readdir(backupFolder + "/", function (err, list) {
                            list.sort((folder1, folder2) => { return folder1.attrs.mtime < folder2.attrs.mtime; });

                            //If there are more than 2 backups, it removes the excess one (this ensures there is a maximum of 3 backups stored) 
                            if (list.length > 2) {
                                for (let i = 2; i < list.length; i++) {
                                    let removeCommand = `rm -R ${bckFolder}/${list[i].filename}`;
                                    
                                    ftpcontroller.client.exec(removeCommand, function(err, rmStream) {
                                        rmStream.on('data', function() {}).on('close', function(rmCode) {
                                            applog.LogInfo("Removed old backup");
                                         });
                                    });
                                }
                                mcb();
                            } else {
                                //nothing else to do
                                mcb();
                            }
                        })
                    }
                });
            }
        })
    }

    /**
     * Removes the contenttes of the given folder
     * 
     * @param {String} path The path of the folder to cleanup
     * @param {Function} dispatcherCallback The callbacl to call when the process if finished
     */
    _removeFolderContent(path, dispatcherCallback) {
        let removeCommand = `rm -R ${path}*`;
        let mcb = dispatcherCallback;

        ftpcontroller.client.exec(removeCommand, function(err, rmStream) {
            rmStream.on('data', function() {}).on('close', function(rmCode) {
                applog.LogInfo("Deploy backup cleanup performed");
                mcb();
             });
        });

        //mcb();
    }

    /**
     * Searchs for folders inside a given path 
     * 
     * @param {String} path The path to search for folders
     * @param {Function} listCallBack The function to call with all of the existing folders list
     * @param {Function} dispatcherCallback The function to call back a dispatcher
     */
    _listbackupfolder(path, listCallBack, dispatcherCallback) {
        let mcb = dispatcherCallback;

        ftpcontroller.sftp.readdir(path, function(err, list) {
            let returnList = new Array();

            if (list) {
                list.forEach(item => {
                    let it = item.filename.split("_");
    
                    returnList.push({
                        fullpath: path + "/" + item.filename,
                        foldername: item.filename, 
                        date: ftpcontroller._denormalizeDate(it[1]), 
                        time: ftpcontroller._denormalizeTime(it[2])});
                })
            }

            listCallBack(returnList);
            mcb();
        });
    }

    _Teste_ExecuteCommandIntoConsole(path, dispatcherCallback) {
        let mcb = dispatcherCallback;

        ftpcontroller.client.exec("ls -LR "+ path, function(err, stream) {
            stream.on('data', function (data) {
                console.log("STDOUT: " + data);
                
            }).stderr.on('data', function(data) {
                console.log("STDERR: " + data);

            }).on('close', function (code, signal) {
                let a = "";
                mcb();
            });
        })
    }

    /**
     * Performs a full backup of the current deploy path
     * 
     * @param {Object} serverConfig The object that contains the server configuration
     * @param {String} backupFolder The path for the backup folder
     * @param {Function} dispatcherCallback The method to call back when the process is finished
     */
    _doFullBackup(serverConfig, backupFolder, dispatcherCallback) {
        let deployPath = serverConfig.server_deploy_path + "/";

        //let removeCommand = `rm -R ${backupFolder}`;  //"rm -R /home/temp/backup/"
        let copyCommand = `cp -R ${deployPath} ${backupFolder}/`; //"cp -R /home/temp/ftp-example/ /home/temp/backup"
        let mcb = dispatcherCallback;

        ftpcontroller.sftp.readdir(deployPath, function(err, list) {    //Ensures that the deploy folder has files to backup before proceding with the operation
            if (list.length > 0) {

                ftpcontroller.client.exec(copyCommand, function(err, cpStream) {
                    cpStream.on('data', function() {}).on('close', function(cpCode) {
                        applog.LogInfo("Full backup finished");
                        mcb();
                    })
                });

            } else {
                mcb();
            }
        })
    }

    /**
     * Restores the selected backup in the deploy folder of this server
     * 
     * @param {Object} serverConfig The object that contains all of the properties of the server
     * @param {String} backupFolder The path to the backup folder
     * @param {Function} dispatcherCallback The function to call when the process completes
     */
    _doRestore(serverConfig, backupFolder, dispatcherCallback) {
        let removeCommand = `rm -R ${serverConfig.server_deploy_path}/*`;
        let copyCommand = `cp -R ${backupFolder}/* ${serverConfig.server_deploy_path}/`;
        let mcb = dispatcherCallback;

        ftpcontroller.client.exec(removeCommand, function(err, rmStream) {
            rmStream.on('data', function() {}).on('close', function(rmCode) {
                applog.LogInfo("Deleted all files on the deploy path");
    
                ftpcontroller.client.exec(copyCommand, function(err, cpStream) {
                    cpStream.on('data', function() {}).on('close', function (spCode) {
                        applog.LogInfo("Restore is complete");
                        mcb()
                    })
                });

            });
        });
    }

    /**
     * Performs a deploy of all of the files and folders inside the given structure
     * 
     * @param {Object} serverconfig The object that contains the server configurations
     * @param {ObjectArray} structureToUpload The Object array that contains all of the folder/file structure
     * @param {Function} dispatcherCallback The method to call back when the process is finished
     */
    _doDeploy(path, serverconfig, structureToUpload, secondaryProgressCallback, dispatcherCallback) {
        //This process needs to spawn a new dispatcher to ensure that an attempt to copy/create a file/folder does not occour
        //while an operation is in course. This will generate errors and prevent files from being uploaded/folders from being created
        let dispatcher = new Dispatcher();
        dispatcher.Init(dispatcherCallback, secondaryProgressCallback);

        structureToUpload.forEach(item => {
            let completePath = serverconfig.server_deploy_path + "/" + item.path;
            let uploadCompletPath = `${path}${__appglobals.localPathSplitter}${item.path}`;

            if (item.isFolder === true) {
                dispatcher.PlaceOperation(ftpcontroller._FtpCreateFolder, [completePath]);

            } else {
                dispatcher.PlaceOperation(ftpcontroller._FtpUploadFile, [uploadCompletPath, completePath]);

            }

        })

        dispatcher.PerformOperations();
    }

    
    /**
     * Starts a full deploy to the specified machine
     * 
     * @param {String} uuid The id of the configuration to use
     * @param {Function} completeCallback The function to call when the process is complete
     */
    PerformFullDeploy(uuid, structureToUpload, completeCallback, mainProgressCallBack, secondaryProgressCallback) {
        //Get's the server configurations
        let serverConfig = configurationcontroller.GetConfiguration(uuid);
        let date = ftpcontroller._normalizeDate(new Date().toLocaleDateString("pt-pt"));
        let time = ftpcontroller._normalizeTime(new Date().toLocaleTimeString("pt-pt"));
        
        let backupFolder = `${__appglobals.linux_config_path}/${serverConfig.id}/backup_${date}_${time}`;
        let localPath = __appglobals.utils.generatePathFromUuid(uuid);

        //Spawn a new process dispather to apply the operations by it's correct order
        let dispatcher = new Dispatcher();
        dispatcher.Init(completeCallback, mainProgressCallBack);

        dispatcher.PlaceOperation(ftpcontroller._StartFtpConnection, [serverConfig], "Connecting to the server");
        dispatcher.PlaceOperation(ftpcontroller._StartSftp, [], "");
        dispatcher.PlaceOperation(ftpcontroller._CreateBackupFolder, [__appglobals.linux_config_path, serverConfig.id], "Ensuring backup needs");
        dispatcher.PlaceOperation(ftpcontroller._doFullBackup, [serverConfig, backupFolder], "Creating the backup");
        dispatcher.PlaceOperation(ftpcontroller._removeFolderContent, [serverConfig.server_deploy_path + "/"], "Removing old files");
        dispatcher.PlaceOperation(ftpcontroller._doDeploy, [localPath, serverConfig, structureToUpload, secondaryProgressCallback], "Performing the deploy");
        dispatcher.PlaceOperation(ftpcontroller._StopFtpConnection, [], "");

        dispatcher.PerformOperations();
    }

    PerformFullDeployLocal(uuid, structureToUpload, completeCallback, mainProgressCallBack, secondaryProgressCallback, localPath) {
        let serverConfig = configurationcontroller.GetConfiguration(uuid);
        let date = ftpcontroller._normalizeDate(new Date().toLocaleDateString("pt-pt"));
        let time = ftpcontroller._normalizeTime(new Date().toLocaleTimeString("pt-pt"));
        
        let backupFolder = `${__appglobals.linux_config_path}/${serverConfig.id}/backup_${date}_${time}`;

        //Spawn a new process dispather to apply the operations by it's correct order
        let dispatcher = new Dispatcher();
        dispatcher.Init(completeCallback, mainProgressCallBack);

        dispatcher.PlaceOperation(ftpcontroller._StartFtpConnection, [serverConfig], "Connecting to the server");
        dispatcher.PlaceOperation(ftpcontroller._StartSftp, [], "");
        dispatcher.PlaceOperation(ftpcontroller._CreateBackupFolder, [__appglobals.linux_config_path, serverConfig.id], "Ensuring backup needs");
        dispatcher.PlaceOperation(ftpcontroller._doFullBackup, [serverConfig, backupFolder], "Creating the backup");
        dispatcher.PlaceOperation(ftpcontroller._removeFolderContent, [serverConfig.server_deploy_path + "/"], "Removing old files");
        dispatcher.PlaceOperation(ftpcontroller._doDeploy, [localPath, serverConfig, structureToUpload, secondaryProgressCallback], "Performing the deploy");
        dispatcher.PlaceOperation(ftpcontroller._StopFtpConnection, [], "");

        dispatcher.PerformOperations();
    }

    PerformPartialDeployLocal(uuid, structureToUpload, completeCallback, mainProgressCallBack, secondaryProgressCallback, localPath) {
        let serverConfig = configurationcontroller.GetConfiguration(uuid);
        let date = ftpcontroller._normalizeDate(new Date().toLocaleDateString("pt-pt"));
        let time = ftpcontroller._normalizeTime(new Date().toLocaleTimeString("pt-pt"));
        
        let backupFolder = `${__appglobals.linux_config_path}/${serverConfig.id}/backup_${date}_${time}`;

        //Spawn a new process dispather to apply the operations by it's correct order
        let dispatcher = new Dispatcher();
        dispatcher.Init(completeCallback, mainProgressCallBack);

        dispatcher.PlaceOperation(ftpcontroller._StartFtpConnection, [serverConfig], "Connecting to the server");
        dispatcher.PlaceOperation(ftpcontroller._StartSftp, [], "");
        dispatcher.PlaceOperation(ftpcontroller._CreateBackupFolder, [__appglobals.linux_config_path, serverConfig.id], "Ensuring backup needs");
        dispatcher.PlaceOperation(ftpcontroller._doFullBackup, [serverConfig, backupFolder], "Creating the backup");
        dispatcher.PlaceOperation(ftpcontroller._doDeploy, [localPath, serverConfig, structureToUpload, secondaryProgressCallback], "Performing the deploy");
        dispatcher.PlaceOperation(ftpcontroller._StopFtpConnection, [], "");

        dispatcher.PerformOperations();
    }

    /**
     * Search the root restore folder for any existing backups
     * 
     * @param {String} uuid The uuid of the server configuration to user
     * @param {Function} listCallback The function to call with the backup list
     * @param {Function} completeCallback The function to call when the process is finished
     */
    SearchBackups(uuid, listCallback, completeCallback) {
        let serverConfig = configurationcontroller.GetConfiguration(uuid);
        let path = __appglobals.linux_config_path;

        let dispatcher = new Dispatcher();
        dispatcher.Init(completeCallback);

        dispatcher.PlaceOperation(ftpcontroller._StartFtpConnection, [serverConfig], "Connecting to the server");
        dispatcher.PlaceOperation(ftpcontroller._StartSftp, [], "");
        dispatcher.PlaceOperation(ftpcontroller._listbackupfolder, [path+"/"+serverConfig.id, listCallback], "Gettings backup folders from the server");
        dispatcher.PlaceOperation(ftpcontroller._StopFtpConnection, [], "");

        dispatcher.PerformOperations();
    }

    /**
     * Starts a restore process on the server
     * 
     * @param {String} uuid The id of the server configuration to use
     * @param {String} remoteBackupPath The path on the server where the files should be placed
     * @param {Function} completeCallback The function to call when the process is complete
     */
    StartRestoreProcess(uuid, remoteBackupPath, completeCallback) {
        let serverConfig = configurationcontroller.GetConfiguration(uuid);
        let path = __appglobals.linux_config_path;

        let dispatcher = new Dispatcher();
        dispatcher.Init(completeCallback);

        dispatcher.PlaceOperation(ftpcontroller._StartFtpConnection, [serverConfig], "Connecting to the server");
        dispatcher.PlaceOperation(ftpcontroller._StartSftp, [], "");
        dispatcher.PlaceOperation(ftpcontroller._doRestore, [serverConfig, remoteBackupPath], "Restoring the folders and files");
        dispatcher.PlaceOperation(ftpcontroller._StopFtpConnection, [], "");

        dispatcher.PerformOperations();
    }

}

const ftpcontroller = new FtpController();