class ConfigurationController extends Base {

    constructor() {
        super();

        //Initializes the internal objects needed for this controller to work
        this.__config_list = new Array();
        this.__filesystem = require('fs');
    }

    /**
     * Creates the card elements on the side bar of the window
     */
    __CreateCards() {
        //Clear the existing cards in the html
        let existing = document.querySelectorAll('[data-servercard="true"]');
        existing.forEach(m => {
            m.parentElement.removeChild(m);
        })

        let element = document.getElementById(__appglobals.views_sideNavHeaderId);
        let cards = { card: new Array() };

        configurationcontroller.__config_list.forEach((c) => {
            cards.card.push(c)
        })

        let rendedCards = configurationcontroller.GetViewAsHtml("sidebar/server-card", cards);
        element.insertAdjacentHTML('afterend', rendedCards);
    }

    __CreateConfigObject(uuid) {
        return {
            name: document.getElementById(__appglobals.form_serverconf_name).value,
            server: document.getElementById(__appglobals.form_serverconf_server).value,
            port: document.getElementById(__appglobals.form_serverconf_port).value,
            username: document.getElementById(__appglobals.form_serverconf_username).value,
            password: document.getElementById(__appglobals.form_serverconf_password).value,
            server_deploy_path: document.getElementById(__appglobals.form_serverconf_serverdeploypath).value,
            gitUrl: document.getElementById(__appglobals.form_serverconf_giturl).value,
            id: uuid
        }
    }

    __UpdateConfigItems(confItem) {
        confItem.name = document.getElementById(__appglobals.form_serverconf_name).value;
        confItem.server = document.getElementById(__appglobals.form_serverconf_server).value;
        confItem.port = document.getElementById(__appglobals.form_serverconf_port).value;
        confItem.username = document.getElementById(__appglobals.form_serverconf_username).value;
        confItem.password = document.getElementById(__appglobals.form_serverconf_password).value;
        confItem.server_deploy_path = document.getElementById(__appglobals.form_serverconf_serverdeploypath).value;
        confItem.gitUrl = document.getElementById(__appglobals.form_serverconf_giturl).value;
    }

    /**
     * Loads the servers configuration from a Json file and fills the left side bar of the app
     */
    LoadConfiguration() {
        if (configurationcontroller.__filesystem.existsSync(__appglobals.config_dataconfigFile)) {
            let file_content = configurationcontroller.__filesystem.readFileSync(__appglobals.config_dataconfigFile, __appglobals.config_fileEncoding);
            configurationcontroller.__config_list = JSON.parse(file_content);
            configurationcontroller.__CreateCards();
            __appglobals.RestartVisualElements();

        }
    }
    
    /**
     * Saves the current servers configuration into a Json file
     */
    SaveConfiguration() {
        let toSave = JSON.stringify(configurationcontroller.__config_list);

        configurationcontroller.__filesystem.writeFile(__appglobals.config_dataconfigFile, toSave, __appglobals.config_fileEncoding, function(err) {
            if (err) {
                console.log("error writting file: " + err);
            }
        })
    }

    /**
     * Loads the server properties form into the main window zone of the app
     * 
     * @param {String} id The name of the view to load
     */
    NavigateToView(id, isnew) {
        let model = {};

        if (id) {
            model = configurationcontroller.__config_list.find(c => c.id === id) || model;
        }

        model.isnew = (isnew === "true");

        __appglobals.CloseTooltips();
        configurationcontroller.ShowView("mainwindow/server-properties", model, __appglobals.views_mainWindowId);
        __appglobals.RestartVisualElements();
    }

    /**
     * Adds a new configuration to the existing configurations
     */
    AddConfiguration(uuid) {
        let confItem = configurationcontroller.__config_list.find(c => c.id === uuid);

        //if it's a new item, creates it, saves the json, updates the side view and returns true
        if (!confItem) {
            let conf = configurationcontroller.__CreateConfigObject(uuid);

            configurationcontroller.__config_list.push(conf);
            configurationcontroller.SaveConfiguration();
            configurationcontroller.__CreateCards();

            __appglobals.CloseTooltips();
            __appglobals.RestartVisualElements();
            maincontroller.ShowNewToast("Configuration added");
            return true;
        }

        //If this point is reached, it means that the object is a duplicated and deals with it accordingly
        maincontroller.InsertBaseModal(
            "Override configuration",
            "Are you sure you want to override the current configuration?",
            "Cancel",
            "Confirm",
            "",
            "configurationcontroller.EditConfiguration('"+uuid+"'); configurationcontroller.NavigateToView('"+uuid+"','false');"
        );

        return false;
    }

    EditConfiguration(id) {
        let confItem = configurationcontroller.__config_list.find(c => c.id === id);
        let gitUrl = confItem.gitUrl;

        configurationcontroller.__UpdateConfigItems(confItem);

        if (gitUrl !== confItem.girUrl) {
            let gitPath = __appglobals.utils.generatePathFromUuid(confItem.id);
            __appglobals.utils.RemoveOlderGitClone(gitPath);
        }

        configurationcontroller.SaveConfiguration();
        configurationcontroller.__CreateCards();
        __appglobals.CloseTooltips();
        __appglobals.RestartVisualElements();
        maincontroller.ShowNewToast("Configuration updated");
    }

    /**
     * Removes a server configuration from the system
     */
    RemoveConfiguration(id) {
        //Ask the user to ensure the delete was not pressed by mistake
        maincontroller.InsertBaseModal(
            "Delete configuration",
            "Are you sure you want to delete the current configuration?",
            "Cancel",
            "Confirm",
            "",
            "configurationcontroller.DeleteConfiguration('"+id+"'); configurationcontroller.ShowView('mainwindow/entrance', {}, __appglobals.views_mainWindowId);"
        );
    }

    DeleteConfiguration(id) {
        configurationcontroller.__config_list = configurationcontroller.__config_list.filter(it => it.id !== id);

        configurationcontroller.SaveConfiguration();
        configurationcontroller.__CreateCards();
        __appglobals.CloseTooltips();
        __appglobals.RestartVisualElements();
        maincontroller.ShowNewToast("Configuration removed");
    }

    /**
     * Get's the configuration values of a server, by the uuid
     * 
     * @param {String} id The uuid of the configuration to obtain
     */
    GetConfiguration(id) {
        return configurationcontroller.__config_list.find(c => c.id === id);
    }

}

const configurationcontroller = new ConfigurationController();
configurationcontroller.LoadConfiguration();