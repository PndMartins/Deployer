Treeview = function() {
    var self = this;

    self.init = function(treeID) {
        self.treeElementID = treeID;
    }

    /**
     * Generates a tree view like structure with all of the folders and files inside 
     * @param {String} rootPath The folder where to start the recursive lookup
     */
    self.PopulateTreeViewFromFileSystem = function(rootPath) {
        //Get's an array with the folder/file structure
        let structure = __appglobals.utils.GetFolderStructureFromPath(rootPath, true);
        let treeStructure = [];
        let treeElement = document.getElementById(self.treeElementID);

        //Creates root element
        let rootElement = _CreateFolderHtml({
            id: 0,
            path: rootPath,
            isFolder: true
        }, true);

        let rootBody = rootElement.querySelector('.collapsible-body');
        treeStructure.push(rootElement);

        //Sorts the information to ensure the files appear before any folder
        structure.sort(function(it1, it2) {
            if (it1.isFolder && !it2.isFolder) { return 1; }
            if (!it1.isFolder && it2.isFolder) { return -1; }
            return 0;
        })

        //Generates the tree nodes using a recursive function
        structure.forEach(function(item) {
            _AddItemToTree(rootElement, rootBody, item);
        })

        //Cleans old tree elements and fill's it with the new ones
        treeElement.innerHTML = "";
        treeStructure.forEach(function(item) {
            treeElement.append(item);
        })

        //Materialize element restart.
        M.AutoInit();
    }

    /**
     * Get's the folder/file structure of a tree that was generated from the file system
     */
    self.GetStructureFromTreeview = function() {
        let elements = document.querySelectorAll('input[type="checkbox"]:indeterminate,input[type="checkbox"]:checked');
        let structure = [];

        elements.forEach((item) => {
            let isRoot = item.getAttribute('data-root') === 'true' ? true : false;

            if (!isRoot) {
                let path = item.getAttribute('data-itempath');
                let isFolder = item.getAttribute('data-objtype') === 'folder'? true : false;
                structure.push({path: path, isFolder: isFolder});
            }

        });

        return structure;
    }

    /**
     * Start generating a tree and all of it's branches. This function is recursive.
     * 
     * @param {DOMElement} rootElement The root element of the tree
     * @param {DOMElement} rootBody The body of the root element of the tree
     * @param {object} item The item that correspondes to either a folder or a file
     */
    function _AddItemToTree(rootElement, rootBody, item) {
        if (item.isFolder) {
            //Obtains the folder item
            let folderItem = _CreateFolderHtml(item);
            let folderBody = folderItem.querySelector('.collapsible-body');

            //If this folder has files in it, places them on the folder
            if (item.files.length > 0) {
                item.files.forEach(it => {
                    folderBody.append(_CreateFileItem(it));
                })
            }

            //Checks to see if this folder has a parent folder and add's it, if its true
            let parent = rootElement.querySelector(`ul[data-path="${item.parentFolder}"]`);
            if (parent) {
                let parentBody = parent.querySelector('.collapsible-body');
                parentBody.append(folderItem);

            } else {    //If not, adds it to the root folder
                rootBody.append(folderItem);

            }

            //If this folders has children folders, iterates through them (using this recursive function)
            if (item.folders.length > 0) {
                item.folders.forEach(function(f) {
                    _AddItemToTree(rootElement, rootBody, f);
                    
                })
            }
        } else {    //If the item is a file
            //Creates the file item
            let fileElement = _CreateFileItem(item);

            //Checks for the item parent folder and, if true, places it inside that folder
            let parent = rootElement.querySelector(`ul[data-path="${item.parentFolder}"]`);
            if (parent) {
                let parentBody = parent.querySelector('.collapsible-body');
                parentBody.append(fileElement);

            } else { //Places the file inside the root folder
                rootBody.append(fileElement);
            }
        }
    }

    /**
     * Generates a folder DOM elment
     * 
     * @param {object} item The object that contains all of the properties of the item
     * @param {boolan} IsRoot Flag that tells if this item is the root item
     */
    function _CreateFolderHtml(item, IsRoot = false) {
        //Creates a materialize collapsible element to act as a folder
        let ulRootElement = document.createElement('ul');
        let liBaseElement = document.createElement('li');
        
        let collapsibleHeader = document.createElement('div');
        let collapsibleHeaderIcon = document.createElement('i');
        let collapsibleHeaderText = document.createElement('span');
        
        let collapsibleBody = document.createElement('div');

        let checkboxElement = _CreateCheckbox(item, IsRoot);

        ulRootElement.classList.add('collapsible');
        ulRootElement.classList.add('tree');
        ulRootElement.setAttribute('data-path', item.path);

        liBaseElement.classList.add('tree');

        collapsibleHeader.classList.add('collapsible-header');
        collapsibleHeader.classList.add('grey');
        collapsibleHeader.classList.add('darken-3');
        collapsibleHeader.classList.add('tree');
        collapsibleHeader.classList.add('waves-effect');
        collapsibleHeader.classList.add('waves-light');
        collapsibleHeader.classList.add('orange');

        collapsibleHeaderIcon.classList.add('material-icons');
        collapsibleHeaderIcon.classList.add('orange-text');
        collapsibleHeaderIcon.innerText = "folder";

        collapsibleBody.classList.add('collapsible-body');
        collapsibleBody.classList.add('tree');

        collapsibleHeaderText.innerText = item.path;

        collapsibleHeader.append(checkboxElement);
        collapsibleHeader.append(collapsibleHeaderIcon);
        collapsibleHeader.append(collapsibleHeaderText);

        liBaseElement.append(collapsibleHeader);
        liBaseElement.append(collapsibleBody);

        ulRootElement.append(liBaseElement)

        return ulRootElement;
    }

    /**
     * Generates a file DOM element
     * 
     * @param {object} item The object that contains all of the properties of the item
     */
    function _CreateFileItem(item) {
        let itemElement = document.createElement('div');
        let itemIcon = document.createElement('i');
        let itemText = document.createElement('span');

        let checkboxElement = _CreateCheckbox(item);

        itemElement.classList.add('treenode-file');

        itemIcon.classList.add('material-icons');
        itemIcon.innerText = 'insert_drive_file';

        itemText.innerText = item.path;

        itemElement.append(checkboxElement);
        itemElement.append(itemIcon);
        itemElement.append(itemText);

        return itemElement;
    }

    /**
     * Generates a checkbox DOM elment
     * 
     * @param {object} item The object that contains all of the properties of the item
     * @param {boolan} IsRoot Flag that tells if this item is the root item
     */
    function _CreateCheckbox(item, isRoot = false) {
        let wrapperElement = document.createElement('label');
        let inputElement = document.createElement('input');
        let textElement = document.createElement('span');
        
        inputElement.setAttribute('data-id', item.id)
        inputElement.setAttribute('data-itempath', item.path);
        inputElement.setAttribute('data-objtype', item.isFolder ? 'folder' : 'file');
        inputElement.setAttribute('data-parent', item.parentid);

        if (isRoot) { inputElement.setAttribute('data-root','true')}

        inputElement.addEventListener('click', function(param1) {
            if (this.getAttribute('data-objtype') === 'folder') {
                _UpdateFamilyDown(this);
            }

            _UpdateFamilyUp(this);

            return false;
        });

        wrapperElement.classList.add('tree');

        if (item.isFolder) {
            textElement.classList.add('tree');
        } else {
            textElement.classList.add('treefile');
        }

        inputElement.type = 'checkbox';

        wrapperElement.append(inputElement);
        wrapperElement.append(textElement);

        return wrapperElement;
    }

    /**
     * Propagates upwards the changes of the clicked item
     * 
     * @param {DOMElement} clickedElement The DOMElement that was clicked
     */
    function _UpdateFamilyUp(clickedElement) {
        let parent = clickedElement.getAttribute('data-parent');
    
        if (parent) {
            let parentElement = document.querySelector(`input[type="checkbox"][data-id="${parent}"]`)

            if (parentElement) {
                if (!parentElement.checked) {
                    parentElement.indeterminate = true;
                }
                
                _UpdateSiblings(clickedElement);
                _UpdateFamilyUp(parentElement);
            } 
        } 
    }

    /**
     * Checks if all of the sibling elements are checked and changes the status of the parent folder to
     * checked, unchecked or indeterminate
     * 
     * @param {DOMElement} element The element that was clicked
     */
    function _UpdateSiblings(element) {
        let parent = element.getAttribute('data-parent');
        let parentElement = document.querySelector(`input[type="checkbox"][data-id="${parent}"]`);
        let siblings = document.querySelectorAll(`input[type="checkbox"][data-parent="${parent}"]`);
        let allChecked = true;
        let noneChecked = true;

        siblings.forEach((brother) => {
            if (!brother.checked) { allChecked = false; } 
            if (brother.checked || brother.indeterminate) { noneChecked = false; }
        })

        if (allChecked)  {
            parentElement.indeterminate = false;
            parentElement.checked = true;
        } else if (noneChecked) {
            parentElement.indeterminate = false;
            parentElement.checked = false;
        } else {
            parentElement.indeterminate = true;
            parentElement.checked = false;
        }
    }

    /**
     * Propagates downwards the status of the current folder item that was clicked.
     * 
     * @param {DOMElement} clickedElement The element that was clicked
     */
    function _UpdateFamilyDown(clickedElement) {
        let id = clickedElement.getAttribute('data-id');
        let isRoot = clickedElement.getAttribute('data-root');;
        let selector = '';
        
        if (isRoot) {
            selector = 'input[type="checkbox"][data-parent]:not([data-root])';
        } else {
            selector = `input[type="checkbox"][data-parent="${id}"]`;
        }

        let children = document.querySelectorAll(selector);

        if (children.length > 0) {
            children.forEach((child) => {
                child.checked = clickedElement.checked;
                /*
                    When drilling down a folder, it's either checked or unchecked. 
                    There is no indeterminate.
                 */
                child.indeterminate = false;

                if (!isRoot) {
                    if (child.getAttribute('data-objtype') === 'folder') {
                        _UpdateFamilyDown(child, false);
                    }
                }
            })
        }
    }

    return self;
}