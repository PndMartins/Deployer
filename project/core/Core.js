/**
 * Starting core
 * creator: Pedro Martins
 */
class Core {

    /**
     * Initializes all of the objects used in this class
     */
    constructor() {
        //collections
        this.__controllers = new Array();
        this.__views = new Array();

        this.__filesystem = require('fs');

        //loads the files and folders from the view folder
        this.ReadViews(this.__view_folder);
    }

    /**
     * Obtain the content of the requested view
     * 
     * @param {String} ViewName The name/path of the view to obtain (without extension)
     */
    GetViewContent(ViewName) {
        let content = this.__views.find(f => f.name === ViewName).content;
        return content;
    }

     /**
     * Navigates to a controller and invokes the needed method.
     * 
     * @param {String} controller The name of the controller that should be invoked (Class name).
     * @param {String} method The name of the method to invoke on the controller.
     * @param  {...any} params The parameters that should be passed to the controller.
     */
    Navigate(controller, method, ...params) {
        let foundController = this.__controllers.find(f => f.name === controller);

        if (!foundController) {
            console.log(`The controller "${controller}" was not found`);
            return;
        }

        if (typeof foundController.object[method] == "undefined") { 
            console.log(`The method "${method}"of the controller ${controller} was not found`);
            return;
        }

        foundController.object[method](...params);
    }

    /**
     * Registers the objects with the core. Only registered objects can be navigated to.
     * 
     * @param {Class} classobject The object to register within the core.
     */
    Register(classobject) {
        let item = {name: classobject.constructor.name, object: classobject};
        this.__controllers.push(item);
    }

    /**
     * Reads the folders and files inside the view folder
     * 
     * @param {String} path The from where to start the recursive folder/files reading
     */
    ReadViews(path) {
        let serializer = new XMLSerializer();
        let templates = document.querySelectorAll('link[rel="import"');
        templates.forEach((t) => {
            var item = {name: t.getAttribute("data-name"), content: ""};

            var template = t.import.querySelector(".template");
            var content = document.importNode(template.content, true);

            item.content = serializer.serializeToString(content);
            this.__views.push(item);
        })
    }
}
const core = new Core();