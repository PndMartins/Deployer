class WizardController extends Base {

    constructor() {
        super();
        
        this.Reset();
    }

    __step_0(configId, serverName) {
        this.currentServerId = configId;
        this.currentServerName = serverName;
        this.currentStep = 0;

        __appglobals.CloseTooltips();
        wizardcontroller.ShowView('wizard/step-0-type', {servername: this.currentServerName, id: this.currentServerId}, __appglobals.views_mainWindowId);
        __appglobals.RestartVisualElements();
    }

    __step_1(selection) {
        maincontroller.ChangePreloaderState();
        __appglobals.CloseTooltips();
        this.processType = selection;

        if (selection == __appglobals.DeployType.Full) {
            maincontroller.ShowNewToast("Initiating clone")
            gitcontroller.InitRepoFromConfigPage(this.currentServerId, function() {

                maincontroller.ShowNewToast("Getting branches")
                gitcontroller.GetBranches(wizardcontroller.currentServerId, function(branches) {
                    gitcontroller.GitCostumGetBranches(wizardcontroller.currentServerId, function(result) {
                        let list = { card: new Array() };

                        branches.forEach(b => {
                            let tempName = b.replace("remotes/", "");
                            let info = result.find(r => r.branch === tempName);
                            
                            list.card.push(
                                {
                                    cardName: info.branch,
                                    commit_author: info.commit_author,
                                    commit_hash: info.commit_hash,
                                    commit_msg: info.commit_msg,
                                    last_commit_date: info.date,
                                    last_commit_date_descriptive: info.when
                                }
                            );
                        })
    
                        wizardcontroller.ShowView('wizard/full/step-1', null, __appglobals.views_mainWindowId);
                        wizardcontroller.ShowView('wizard/full/step-1-row', list, __appglobals.views_table_bodyid);
                        wizardcontroller.currentStep = 1;
                        maincontroller.ChangePreloaderState();

                    })

                }, function (err) {
                    applog.LogError(err);
                    maincontroller.ShowNewToast("An error has occoured. Please check the console.");
                    maincontroller.ChangePreloaderState();

                });

            }, function(err, uuid) {
                if (err) {
                    applog.LogError(err);
                    maincontroller.ShowNewToast("An error has occoured. Please Check the console.");
                    maincontroller.ChangePreloaderState();

                }
                
            })
        } else if (selection == __appglobals.DeployType.Local) {

            wizardcontroller.ShowView('wizard/local-full/step-1', null, __appglobals.views_mainWindowId);
            wizardcontroller.currentStep = 1;
            maincontroller.ChangePreloaderState();

        } else if (selection == __appglobals.DeployType.Local_partial) {

            wizardcontroller.ShowView('wizard/local-partial/step-1', null, __appglobals.views_mainWindowId);
            wizardcontroller.currentStep = 1;
            maincontroller.ChangePreloaderState();

        } else if (selection == __appglobals.DeployType.Backups) {
            maincontroller.ShowNewToast("Checking for backups");

            ftpcontroller.SearchBackups(wizardcontroller.currentServerId, function(list) {
                let objects = { backup: new Array() };

                list.forEach(l => {
                    objects.backup.push({ id: __appglobals.utils.generateUUID(), date: l.date, time: l.time, name: l.name, fullpath: l.fullpath });
                });

                wizardcontroller.currentBackupFolders = objects;
                wizardcontroller.ShowView('wizard/backup/step-1', objects, __appglobals.views_mainWindowId);
                wizardcontroller.currentStep = 1;

            }, function() {
                maincontroller.ShowNewToast("Process complete");
                maincontroller.ChangePreloaderState();

            });
        }
        
    } 

    __step_2(selection) {
        maincontroller.ChangePreloaderState();
        __appglobals.CloseTooltips();
        
        if (this.processType == __appglobals.DeployType.Full) {
            maincontroller.ShowNewToast("Performing a full deploy to the server");
            applog.saveErrors = true;

            //Checks out the selected branch
            gitcontroller.GitCheckout(wizardcontroller.currentServerId, selection, 
                function() {
                    applog.LogSuccess("Branch pulled");
                    applog.LogInfo("Reading file and folder structure");

                    //Obtains the file and folder structure from the pulled branch to pass to the full deploy
                    let structure = __appglobals.utils.GetFolderStructure(wizardcontroller.currentServerId);

                    __appglobals.CloseTooltips();
                    wizardcontroller.ShowView('wizard/showprogress', null, __appglobals.views_mainWindowId);        

                    //Performs a full deploy into the server
                    ftpcontroller.PerformFullDeploy(wizardcontroller.currentServerId, structure, wizardcontroller.AfterDeployProcess, 
                        maincontroller.UpdateMainProgressBar, maincontroller.UpdateSecondaryProgressBar);

                },
                function(err) {
                    applog.LogError("Error while pulling the branch: " + err);
                    applog.LogError("Process aborted");
                    applog.saveErrors = false;
                    applog.ClearErrorLogs();
                    maincontroller.ChangePreloaderState();
                }
            );
        } else if (this.processType == __appglobals.DeployType.Local) {
            let element = document.getElementById(selection);
            let structure = __appglobals.utils.GetFolderStructureFromPath(element.value, false);

            applog.saveErrors = true;
            wizardcontroller.ShowView('wizard/showprogress', null, __appglobals.views_mainWindowId);

            //Performs a full deploy to the server, from a local folder
            ftpcontroller.PerformFullDeployLocal(wizardcontroller.currentServerId, structure, wizardcontroller.AfterDeployProcess, 
                maincontroller.UpdateMainProgressBar, maincontroller.UpdateSecondaryProgressBar, element.value);

        } else if (this.processType == __appglobals.DeployType.Local_partial) {
            let element = document.getElementById(selection);
            let structure = __appglobals.treeview.GetStructureFromTreeview();
            
            applog.saveErrors = true;
            wizardcontroller.ShowView('wizard/showprogress', null, __appglobals.views_mainWindowId);

            ftpcontroller.PerformPartialDeployLocal(wizardcontroller.currentServerId, structure, wizardcontroller.AfterDeployProcess, 
                maincontroller.UpdateMainProgressBar, maincontroller.UpdateSecondaryProgressBar, element.value);

        } else if (this.processType == __appglobals.DeployType.Backups) {
            
            let backup = this.currentBackupFolders.backup.find(it => it.id === selection);

            maincontroller.InsertBaseModal(
                "Restore backup",
                `Are you sure you want to restore this backup? (Date: ${backup.date} Time: ${backup.time})`,
                "Cancel",
                "Confirm",
                "wizardcontroller.CancelRestoreProcess();",
                `wizardcontroller.StartRestoreProcess('${wizardcontroller.currentServerId}','${selection}');`,
                "NOTE: This operation will delete ALL of the current files inside of the deploy folder and place the files that exist in this backup."
            );

            wizardcontroller.currentStep = 2;
        }
    }

    AfterDeployProcess() {
        applog.LogSuccess("Process completed");
        maincontroller.ShowNewToast("Process completed");
        maincontroller.ChangePreloaderState();

        __appglobals.CloseTooltips();

        let model = {
            warningcount: applog.warningList.length,
            errorcount: applog.errorList.length,
            warnings: applog.warningList,
            errors: applog.errorList
        }

        wizardcontroller.ShowView('wizard/completed', model, __appglobals.views_mainWindowId);
        applog.saveErrors = false;
        applog.ClearErrorLogs();
        __appglobals.RestartVisualElements();
    }

    CancelRestoreProcess() {
        this.currentStep = 1;
        maincontroller.ChangePreloaderState();
    }

    StartRestoreProcess(uuid, selection) {
        if (wizardcontroller.currentServerId == uuid && wizardcontroller.currentStep == 2) {
            //Starts the restore process;
            maincontroller.ShowNewToast("Starting the restore process");
            applog.saveErrors = true;

            let backup = this.currentBackupFolders.backup.find(it => it.id === selection);
            ftpcontroller.StartRestoreProcess(uuid, backup.fullpath, wizardcontroller.AfterDeployProcess)
        }
    }

    Reset() {
        this.processType = 0;
        this.currentStep = 0;
        this.currentServerId = "";
        this.currentServerName = "";
        this.inProcess = false;
        this.currentBackupFolders = null;
        __appglobals.CloseTooltips();
    }

    StartProcess(configId, ServerName) {
        wizardcontroller.Reset();
        this.__step_0(configId, ServerName);
    }
    /**
     * Proceeds for the new step
     * 
     * @param {Integer} newStep The new step to go to
     * @param {String} configId The id of the server configuration to use. It's optional and will only be assigned on step 0. For the rest of the steps, it will use the values in memory.
     */
    ShowStep(newStep, selection) {
        if (this.currentStep == 0 && newStep == 1) {
            this.__step_1(selection);

        } else if (this.currentStep == 1 && newStep == 2) {
            this.__step_2(selection);
        }

        //applies any tooltips available
        $('[data-toggle="tooltip"]').tooltip();
    }

}

const wizardcontroller = new WizardController();