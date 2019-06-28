const {ipcRenderer} = require('electron');
class MainController extends Base {

    constructor() {
        super();

        this.ShowView("sidebar/side-menu", {}, __appglobals.views_sideBarId);
        this.ShowView("mainwindow/entrance", {}, __appglobals.views_mainWindowId);
    }
    /**
     * Shows/hides the pre-loader, depending on the current state
     */
    ChangePreloaderState() {
        let preloaderElement = document.getElementsByClassName("spinner");
        preloaderElement[0].classList.toggle("hide");
    }


    /**
     * Show an Cancel/Confirm modal to the user, with a given message
     * 
     * @param {String} Title The title of the modal message
     * @param {String} Message The message to show inside de modal
     * @param {String} CancelLabel The text to show on the "Cancel" label
     * @param {String} ConfirmLabel The text to show on the "Confirm" label
     * @param {Function} CancelCallback The Function to call when the user presses the cancel button (optional)
     * @param {Function} ConfirmCallback The function to call when the user presses the confirm button
     */
    InsertBaseModal(Title, Message, CancelLabel, ConfirmLabel, CancelCallback, ConfirmCallback, Note = "") {
        let modalInfo = {
            title: Title,
            message: Message,
            cancel: CancelLabel,
            confirm: ConfirmLabel,
            cancel_callback: CancelCallback,
            confirm_callback: ConfirmCallback,
            showNote: Note != "",
            note: Note
        }

        //Removes any existing base modals
        let modal = document.getElementById("base-modal");
        if (modal) {
            modal.parentElement.removeChild(modal);
        }
    
        //Adds a new modal message
        let renderedModal = this.GetViewAsHtml("modals/base-modal", modalInfo);
        let mainwindow = document.getElementById(__appglobals.views_mainWindowId);
        mainwindow.insertAdjacentHTML('beforeend', renderedModal);

        //Shows the modal to the user
        var elem = document.querySelector('.modal');
        var instance = M.Modal.init(elem);
        instance.open();

        if (Note != "" ) {
            setTimeout(() => {
                var elem = document.getElementById("modal-note-element");
                elem.click();
            }, 1000);
        }
    }

    /**
     * Show a new toast item in the window to the user
     * 
     * @param {String} Message The message to show in the toast item
     */
    ShowNewToast(Message) {
        let toastModel = {
            message: Message
        }

        let renderedToast = this.GetViewAsHtml("components/toast", toastModel);
        M.toast({html: renderedToast, classes: 'grey darken-2 grey-text text-lighten-5'});
    }

    UpdateMainProgressBar(current, max) {
        let mainProcessStatusRow = document.getElementById("main-process-status");

        let mainProgressTitle = document.getElementById("process-main-title");
        let mainProgressValues = document.getElementById("process-main-status");
        let mainProgressBar = document.getElementById("main-progressbar");
        let value = (current * 100) / max;

        mainProgressTitle.innerHTML = "Full deploy current step: ";
        mainProgressValues.innerHTML = `${current}/${max}`;
        mainProgressBar.style.width = value + "%"; //apply math rule here

        mainProcessStatusRow.classList.remove("hide");
    }

    UpdateSecondaryProgressBar(current, max) {
        let secondaryRow = document.getElementById("seconday-process-status");

        let secondaryTitle = document.getElementById("process-secondary-title");
        let secondaryProgressValues = document.getElementById("process-secondary-status");
        let secondaryProgressBar = document.getElementById("secondary-progressbar");
        let value = (current * 100) / max;

        secondaryTitle.innerHTML = "Processing folders and files: ";
        secondaryProgressValues.innerHTML = `${current}/${max}`;
        secondaryProgressBar.style.width = value + "%"; //apply math rule here

        if (value == 100) {
            secondaryRow.classList.add("hide");
        } else {
            secondaryRow.classList.remove("hide");
        }
    }

    ShowDevTools() {
        ipcRenderer.send('showDevTools');
    }

    ShowSettings() {
        let data = 
        { 
            none: this.debug == 0 ? "Checked" : "", 
            devtools: this.debug == 1 ? "Checked" : "",
            app: this.debug == 2 ? "Checked" : "",
            all: this.debug == 3 ? "Checked" : ""
        };
        
        __appglobals.CloseTooltips();
        maincontroller.ShowView("settings/settings", data, __appglobals.views_mainWindowId);
        __appglobals.RestartVisualElements();
    }

    UpdateDebugConsole(value) {
        maincontroller.debug = value;
    }

    
    delete_testConsoleAdd() {
        this.tempCount++;

        let itemValues = {
            message: "This is a test message to the console output " + this.tempCount,
            iconName: "info",
            statusText: "Info"
        };

        let newItem = this.GetViewAsHtml("components/console-item", itemValues);
        let consoleElement = document.getElementById("console-body");
        consoleElement.innerHTML = newItem + consoleElement.innerHTML;
    }
}

const maincontroller = new MainController();