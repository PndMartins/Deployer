ThemeWorker = function() {
    var self = this;
    self.themes = null;
    self.current_theme = null;

    /**
     * Private use only - Obtains all of the items needed to update, with the given selector
     * 
     * @param {String} selector The jquery selector to obtain the elements needed for the css class change
     * @param {String} removeColor The css class that must be removed from the elements
     * @param {String} addColor The css class that must be added to the elements
     */
    function __get_items_to_update(selector, removeColor, addColor) {
        let elements = $(selector);
        elements.toArray().forEach(e => {
            __apply_color($(e), removeColor, addColor);
        })
    }

    function __get_items_to_update_with_exceptions(selector, exception, removeColor, addColor) {
        //adds the html items to remove from the selection, to the selector
        exception.forEach(e => {
            selector = selector + `:not('${e}')`;
        })

        __get_items_to_update(selector, removeColor, addColor);
    }

    /**
     * Private use only - Updates the item with the css classes needed for this theme
     * 
     * @param {String} element The jquery object containing the element to transform
     * @param {String} removeColor The class to remove from the element
     * @param {String} addColor The class to add to the element
     */
    function __apply_color(element, removeColor, addColor) {
        element.removeClass(removeColor);
        element.addClass(addColor);
    }

    /**
     * Private use only - Generates an item containing the properties and values for a given theme
     * 
     * @param {String} Name The name of the theme
     * @param {String} Bg_main The background color for the main items
     * @param {String} Bg_sec The background color for the secondary items
     * @param {String} Border The color for the borders
     * @param {String} TextItem The color for the texts
     */
    function __create_theme(Name, Bg_main, Bg_nav, Bg_status_bar, Border, TextItem, BtPrimary, ProgressBg, BgNavHeader, logo)  {
        return {
            name: Name,
            bg_main: Bg_main,
            bg_nav: Bg_nav,
            bg_status_bar: Bg_status_bar,
            border: Border,
            text: TextItem,
            bt_primary: BtPrimary,
            bg_progress: ProgressBg,
            bg_nav_header: BgNavHeader,
            logo: logo
        }
    }

    /**
     * Initializes all of the needed objects for this controller to work and initialized the objects for the first created theme
     */
    self.init = function() {
        self.themes = new Array();

        self.themes.push(__create_theme("dark", "bg-darktheme-secondary", "bg-dark", "bg-dark", "border border-secondary", "text-light", "btn-light", "bg-secondary","bg-darkergray", "logo-dark"));
        self.themes.push(__create_theme("light", "bg-white", "bg-light", "bg-light", "border","text-dark", "btn-dark", "bg-dark", "bg-lightgray", "logo-light"));
        self.themes.push(__create_theme("blue", "bg-blue", "bg-blue-secondary", "bg-blue-secondary", "border border-info", "text-light", "btn-primary", "bg-blue-light", "bg-blue-navheader","logo-light"));

        self.current_theme = self.themes[0];
    }

    /**
     * Obtains the object that contains the properties of the current theme
     */
    self.get_theme = function() {
        return this.current_theme;
    }

    /**
     * Applies the given theme to the program
     * 
     * @param {String} name The name of the theme to apply
     */
    self.set_theme = function(name) {
        //Search for the theme that was selected
        let newTheme = self.themes.find(t => t.name === name);

        //Changes the logo
        __get_items_to_update('div.logo', self.current_theme.logo, newTheme.logo);

        //Applies backcolor to main window
        __get_items_to_update('#main-window', self.current_theme.bg_main, newTheme.bg_main);

        //Applies backcolor to side nav
        __get_items_to_update('#sidenav', self.current_theme.bg_nav, newTheme.bg_nav);

        //Applies backcolor to status bar
        __get_items_to_update('#status-bar', self.current_theme.bg_status_bar, newTheme.bg_status_bar);

        //Applies backcolor to sidenav header
        __get_items_to_update('#sidenav-header', self.current_theme.bg_nav_header, newTheme.bg_nav_header); 

        //Applies borders
        __get_items_to_update('[class*="'+self.current_theme.border+'"]', self.current_theme.border, newTheme.border);

        //Applies text color
        __get_items_to_update('[class*="'+self.current_theme.text+'"]', self.current_theme.text, newTheme.text);

        //Applies button color
        __get_items_to_update('[class*="'+self.current_theme.bt_primary+'"]', self.current_theme.bt_primary, newTheme.bt_primary);

        //Set's the current theme as the one passed to the function
        this.current_theme = newTheme;
    }

    return self;
}