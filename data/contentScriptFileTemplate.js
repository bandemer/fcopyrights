/**
 * ContentScriptFile for template dialog
 */
window.addEventListener('click', 
    function(event) {
        if (event.target.id == 'save') {
            self.port.emit('saveTemplate', 'test');
        } else {
            return true;
        }
    }, false);





