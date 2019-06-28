class ValidationController extends Base {

    constructor() {
        super();

        //Initializes the internal objects needed for this controller to work
        this.__invalid_class = null;
        this.__valid_class = null;
        this.__after_validation = null;
        this.__errors_found = null;
    }

    /**
     * Generates a message to apply to the fields that do not pass the validation
     * 
     * @param {String} message The message to pass into the element
     * @param {Object} controller Any controller
     */
    __generate_message_element(message) {
        return this.GetViewAsHtml("validation/message", {message: message})
    }

    /**
     * Adds the element into the internal array to ensure the object is changed if it's invalid. Should be called after a validation has already occoured
     * 
     * @param {Boolean} valid Indicates if this element is valid or not
     * @param {element} htmlElement The html element that was verified
     * @param {element} messageElement The message element to add in case the element is invalid
     */
    __add_checked_object(valid, htmlElement, messageElement) {
        this.__after_validation.push({valid: valid, htmlElement: htmlElement, messageElement: messageElement});
    }

    /**
     * Modifies a selector to add a data-group-validation name 
     * 
     * @param {String} normalSelector The current css selector
     */
    __modify_selector_for_group(normalSelector) {
        return this.__group_validation ? 
            `${normalSelector}[data-group-validation="${this.__group_name}"]` :
            normalSelector;
    }

    /**
     * Applies the correct classes into the html elements, that were validated
     * 
     * @param {Boolean} apply_valid True = if the element is valid, a css valid class is applied
     */
    __enforce_validation(applyValid, clearMessages = true) {
        if (clearMessages) {
            let messages = document.querySelectorAll('[data-message="true"]');
            messages.forEach(m => {
                m.parentElement.removeChild(m);
            })
        }
        
        this.__after_validation.forEach(e => {
            if (!e.valid) {
                e.htmlElement.classList.add(this.__invalid_class);
                e.htmlElement.insertAdjacentHTML('afterend', e.messageElement)
                this.__errors_found = true;
            } else {
                applyValid ? e.htmlElement.classList.add(this.__valid_class) : e.htmlElement.classList.remove(this.__valid_class);
                e.htmlElement.classList.remove(this.__invalid_class);
            }
        })
    }

    /**
     * Performs the validations on the given element array
     * 
     * @param {String} selector The selector to obtain the items from the DOM
     * @param {Function} validator_callback The function to call that performs the validation
     */
    __validate(messageHtml, selector, validatorCallback) {
        let elements = document.querySelectorAll(selector);

        elements.forEach(e => {
            let val = this.__after_validation.find(f => f.htmlElement === e);

            if (val == null) {
                let isValid = validatorCallback(e);
                this.__add_checked_object(isValid, e, messageHtml);

            } else if (val.valid) {
                val.valid = validatorCallback(e);
                val.messageElement = messageHtml;
            }
        });
    }

    /**
     * Start the validation of all of the available validations in the class
     * 
     * @param {Boolean} apply_valid True = if the element is valid, a valid css class is applied
     * @returns {Boolean} True if all valid, false if any error was found;
     */
    Validate(applyValid) {
        this.__errors_found = false;
        this.__after_validation = new Array();

        //Validates empty string
        this.__validate(this.__generate_message_element("This field cannot be empty"),
            this.__modify_selector_for_group('input[data-validate*="empty"]'), 
            (e) => { return e.value.trim() !== "";});

        //Validates numbers
        this.__validate(this.__generate_message_element("This field only acepts numbers"),
            this.__modify_selector_for_group('input[data-validate*="number"]'), 
            (e) => { return !isNaN(e.value.trim()) && !isNaN(parseFloat(e.value.trim())); });

        //Validates radios
        this.__validate(this.__generate_message_element("At least on radio button must be selected"),
            this.__modify_selector_for_group('input[data-validate*="radio"]'),
            (e) => {
                let name = e.name;  //Get's the name of the element to validate
                return document.querySelectorAll('[name="'+name+'"]:checked').length > 0; //Checks if any of the radios with the same name is checked
            });

        //Applies the validations to the html
        this.__enforce_validation(applyValid);

        //If an error was found, returns false
        return !this.__errors_found;
    }

    ValidateGroup(groupName, applyValid) {
        this.__group_validation = true;
        this.__group_name = groupName;
        this.Validate(applyValid);
        this.__group_validation = false;
        this.__group_name = "";
        return !this.__errors_found;
    }

    /**
      * Adds an html element to the validation list, with the error flag as true
      * 
      * @param {Boolean} isValid Indicates if the passed element is valid or not
      * @param {Boolean} apply_valid Indicates if, the element is valid, a valid visual element is displayed
      * @param {element} htmlElement The element that should be transformed 
      * @param {String} cleanPreviousValidation Indicates if all of the invalid messages displayed should be removed
      * @param {Controller} Message The message to display on an invalid element
      * @param {Boolean} Controller Any controller
      */
    EnforceError(isValid, applyValid, htmlElement, cleanPreviousValidation, message) {
        this.__after_validation = new Array();

        let messageElement = this.__generate_message_element(message);

        this.__add_checked_object(isValid, htmlElement, messageElement);
        this.__enforce_validation(applyValid, cleanPreviousValidation);
    }

    /**
     * Iniciates the validation object. Set's the css classes to apply in invalid and valid inputs
     * 
     * @param {String} validClass The css class to apply to the valid elements, if needed
     * @param {String} InvalidClass The css class to apply to the invalid elements
     */
    init(validClass, invalidClass) {
        this.__valid_class = validClass;
        this.__invalid_class = invalidClass;
        this.__group_validation = false;
    }

}
const validationcontroller = new ValidationController();
validationcontroller.init(__appglobals.validator_successClass, __appglobals.validator_errorClass);