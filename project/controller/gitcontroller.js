class GitController extends Base {

    constructor() {
        super();

        this.__filesystem = require("fs");
    }

    __sanitize(value, uuid) {
        return value.replace(/[/]/g,"");
    }

    __isCloned(path) {
        return this.__filesystem.existsSync(path);
    }

    __sanitizeCostumRequest(value) {
        return value.replace(/[']/g,"").replace(/\+0000/g,"").trim();
    }

    /**
     * Clones the repository into the correspondent uuid folder
     * 
     * @param {String} uuid The uuid for this git object
     * @param {Function} callback The function to call when the clone is complete
     */
    InitRepoFromConfigPage(uuid, successCallback, errorCallBack) {
        applog.LogInfo("Cloning the project");

        let serverConfiguration = configurationcontroller.GetConfiguration(uuid);
        let gitPath = __appglobals.utils.generatePathFromUuid(uuid);

        if (!this.__isCloned(gitPath)) {
            let cloneGit = require("simple-git/promise");
            cloneGit()
                .silent(true)
                .clone(serverConfiguration.gitUrl, gitPath, {})
                .then(function(result) {
                    applog.LogSuccess("The project was cloned successfully");
                    successCallback();
                })
                .catch(function(err) {
                    errorCallBack(err, uuid);
                })
        } else {
            applog.LogInfo("Project already cloned");
            successCallback();
        }
    }

    /**
     * Get's all of the branches from the git lab
     * 
     * @param {String} uuid The id of the server configuration i use
     * @param {Function} successCallback The function to call after obtaining all of the branches
     * @param {Function} errorCallBack The function to call if an error occours
     */
    GetBranches(uuid, successCallback, errorCallBack) {
        applog.LogInfo("Getting branches");
        
        let gitClient = require("simple-git")(__appglobals.utils.generatePathFromUuid(uuid));

        gitClient.fetch({"--all": null}, function (err, result) {
            if (err) {
                errorCallBack(err)

            } else {

                gitClient.branch(function(err, result) {
                    if (err) {
                        errorCallBack(err);
                    }
        
                    let rs = result["all"];
                    let finalResult = new Array();

                    rs.forEach(item => {
                        if (item.includes("remotes")) {
                            finalResult.push(item);
                        }
                    })

                    successCallback(finalResult);
    
                    applog.LogInfo("All branches obtained");
                })

            }
        });
    }

    GitCheckout(uuid, branch, successCallback, errorCallBack) {
        let su = successCallback;
        let er = errorCallBack;
        
        applog.LogInfo("Pulling branch: " + branch);

        let gitClient = require("simple-git")(__appglobals.utils.generatePathFromUuid(uuid));

        gitClient.checkout(branch, function(err, result) {
            if (err) {
                er(err);
            } else {
                su();
            }
        })
    }

    GitCostumGetBranches(uuid, completeCallback) {
        let gitClient = require("simple-git")(__appglobals.utils.generatePathFromUuid(uuid));

        //git for-each-ref --sort=committerdate refs/heads/ --format='%(HEAD) %(color: cyan)%(committerdate:iso)  %(color:yellow)%(refname:short)%(color:reset) - %(color:red)%(objectname:short)%(color:reset) - %(contents:subject) - %(authorname) (%(color:green)%(committerdate:relative)%(color:reset))'
        gitClient.raw(
            [
                "for-each-ref",
                "--format='%(HEAD) %(committerdate:iso)____%(refname:short)____%(objectname:short)____%(contents:subject)____%(authorname)____(%(committerdate:relative))'"
            ], function(err, result) {
                let finalResult = new Array();
                let list = result.split("\n");

                list.forEach(s => {
                    let item = s.split("____");

                    if (item.length > 1 && item[1].includes("origin") && !item[1].includes("HEAD")) {
                        finalResult.push( {
                            date: gitcontroller.__sanitizeCostumRequest(item[0]),
                            branch: item[1],
                            commit_hash: item[2],
                            commit_msg: item[3],
                            commit_author: item[4],
                            when: gitcontroller.__sanitizeCostumRequest(item[5])
                        })
                    }

                });

                completeCallback(finalResult);
            }
        )
    }

}

const gitcontroller = new GitController();