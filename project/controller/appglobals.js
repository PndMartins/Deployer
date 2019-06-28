class AppGlobals extends Base {

    constructor() {
        super();

        let OS = require('os');

        //Initializes the internal objects needed for this controller to work
        this.__filesystem = require('fs');

        //Console settings
        this.console_selector = "console-body";
        this.consolebadge = "console-badge";
        this.consolestate = "console-state";
        this.consoleitemview = "components/console-item";

        //App settings
        this.localPathSplitter = OS.platform() == "win32" ? "\\" : "/";

        //views related values
        this.views_sideBarId = "sidenav";
        this.views_sideNavHeaderId = "sidenav-header";
        this.views_mainWindowId = "main-window";
        this.views_table_bodyid = "table-body";

        //css classes related values
        this.validator_successClass = "valid";
        this.validator_errorClass = "invalid";

        //config file related values
        this.config_dataconfigFile = `${OS.homedir()}${this.localPathSplitter}auto-deployer${this.localPathSplitter}data.json`;
        this.config_fileEncoding = "utf8";

        //server properties form element id's
        this.form_card_id = "id_card";
        this.form_serverconf_name = "con_name";
        this.form_serverconf_server = "server_name";
        this.form_serverconf_port = "server_port";
        this.form_serverconf_username = "server_username";
        this.form_serverconf_password = "server_password";
        this.form_serverconf_serverdeploypath = "server_deploy_path";
        this.form_serverconf_giturl = "git_clone_url";
        this.form_serverconf_isnew = "is_new";

        //git properties form element id's
        this.git_clone_url = "git_clone_url";

        //Other configuration properties
        //this.git_data_folders = "app/data/";
        this.git_data_folders = `${OS.homedir()}${this.localPathSplitter}auto-deployer${this.localPathSplitter}auto-deployer-git-clones${this.localPathSplitter}`;
        this.linux_config_path = "/etc/opt/auto-deployer";

        //utils configurations
        this.utils_exclusionfolder = [];
        this.utils_exclusionfolder.push(".git");
        this.utils_exclusionfolder.push(".gitignore");

        //wizard controller configurations
        this.wizard_branch_containerID = "branch-container";
        this.DeployType = Object.freeze( {"Full":1, "Partial":2, "Build":3, "Local":4, "Backups":5, "Local_partial":6} );

        document.addEventListener('DOMContentLoaded', function() {
            __appglobals.RestartVisualElements();
        });

        this.utils = new Util();
        this.utils.CreateAppDataFolder(`${OS.homedir()}${this.localPathSplitter}auto-deployer`);

        this.treeview = new Treeview();
        this.treeview.init('treeview');

        console.log(this.config_dataconfigFile);
    }

    NavigateToView() {
        __appglobals.CloseTooltips();
        __appglobals.ShowView("settings/settings", null, __appglobals.views_mainWindowId);
        __appglobals.RestartVisualElements();
    }

    CloseTooltips() {
        let elementsTooltip = document.querySelectorAll('.tooltipped');

        elementsTooltip.forEach((e) => {
            let instance = M.Tooltip.getInstance(e);
            instance.close();
        })
    }

    RestartVisualElements() {
        let elementNav =  document.querySelectorAll('#'+__appglobals.views_sideBarId);
        let elementsCollapsible = document.querySelectorAll('.collapsible');
        let elementsTooltip = document.querySelectorAll('.tooltipped');

        let navs = M.Sidenav.init(elementNav);
        __appglobals.nav = navs[0];
        
        M.Collapsible.init(elementsCollapsible);
        M.updateTextFields();
        M.Tooltip.init(elementsTooltip);
    }

}
const __appglobals = new AppGlobals();