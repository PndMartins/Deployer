class AppLog extends Base {

    constructor() {
        super();

        this.consoleElement = document.getElementById(__appglobals.console_selector);
        this.consoleBadge = document.getElementById(__appglobals.consolebadge);
        this.consoleState = document.getElementById(__appglobals.consolestate);

        this.itemView = __appglobals.consoleitemview;

        this.badgecount = 0;
        this.consoleoutput = 2;
        this.console_state = 0;

        this.warningList = new Array();
        this.errorList = new Array();
        this.saveErrors = false;
    }

    __addmessagetoconsole(message, icon, status, textcolor) {
        //Checks if the log should go into the application console
        if (applog.consoleoutput == 2 || applog.consoleoutput == 3) {
            let item = {
                rowClass: "",
                message: message,
                iconName: icon,
                iconClass: textcolor,
                statusText: status,
                textClass: textcolor,
                timestamp: new Date().toLocaleString('pt-pt')
            }
    
            let newitem = applog.GetViewAsHtml(applog.itemView, item);
            applog.consoleElement.innerHTML = newitem + applog.consoleElement.innerHTML;
            applog.consoleBadge.innerHTML = ++applog.badgecount;
    
            if (applog.consoleBadge.classList.contains('hide')) {
                applog.consoleBadge.classList.remove('hide');
            }
        }

        //Checks if the log should go into the chrome dev tools
        if (applog.consoleoutput == 1 || applog.consoleoutput == 3) {
            switch (status) {
                case "Information": console.log(message);
                case "Error": console.error(message);
                case "Warning": console.warn(message);
                case "Success": console.log('%c'+message, 'color: green');
                default:
            }
        }
    }

    ClearConsole() {
        applog.consoleElement.innerHTML = "";
        applog.ClearErrorLogs();
    }
    
    ClearErrorLogs() {
        applog.errorList = new Array();
        applog.warningList = new Array();
    }

    LogInfo(message) {
        applog.__addmessagetoconsole(message, 'info', 'Information', 'blue-text');
    }

    LogError(message) {
        if (applog.saveErrors) {
            applog.errorList.push({message: message});
        }

        applog.__addmessagetoconsole(message, 'close', 'Error', 'red-text');
    }

    LogWarning(message) {
        if (applog.saveErrors) {
            applog.warningList.push({message: message});
        }

        applog.__addmessagetoconsole(message, 'warning', 'Warning', 'yellow-text');
    }

    LogSuccess(message) {
        applog.__addmessagetoconsole(message, 'done_all', 'Success', 'light-green-text accent-4-text');
    }

    UpdateConsoleState() {
        if (applog.console_state == 0) { //Collapsed
            applog.consoleState.innerHTML = 'expand_more';
            applog.console_state = 1;
            applog.consoleBadge.classList.add('hide');
            applog.badgecount = 0;

        } else { //Expanded
            applog.consoleState.innerHTML = 'expand_less';
            applog.console_state = 0;
        }
    }
}

const applog = new AppLog();