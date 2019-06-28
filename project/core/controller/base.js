/**
 * The base controller of the system that should be inherited by all of the controllers created;
 * 
 * creator: Pedro Martins
 */
class Base {

    constructor() {
        core.Register(this);    //registers this object with the core to perform navigation
    }

    /**
     * Parses the selected view and injects it into the skeleton html
     * 
     * @param {String} ViewName The name of the view to load into the html
     * @param {Object} Model The model containing the values to pass into the view (check mustache syntax)
     * @param {String} Area The id of the html element where this view will be injected
     */
    ShowView(ViewName, Model, Area) {
        let template = Mustache.render(core.GetViewContent(ViewName), Model);
        let element = document.getElementById(Area);
        element.innerHTML = template;
    }

    /**
     * Parses the selected view and returns it as html
     * 
     * @param {String} ViewName The name of the view to obtain
     * @param {Object} Model The object containing the data to pass into the html
     */
    GetViewAsHtml(ViewName, Model) {
        return Mustache.render(core.GetViewContent(ViewName), Model);
    }
}