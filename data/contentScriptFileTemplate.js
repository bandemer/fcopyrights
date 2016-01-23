/**
 * ContentScriptFile for template dialog
 */
window.addEventListener('click', 
    function(event) {
        if (event.target.id == 'save') {
            var templateString = document.getElementById('template').value;
            self.port.emit('save', templateString);
            document.getElementById('save').value = 'Saved!';
        } else if (event.target.id == 'default'){
            self.port.emit('default');
        } else if (event.target.id == 'exit'){
            self.port.emit('exit');
        } else {
            return true;
        }
    }, false);

self.port.on('setTemplate', function(templateValue){ document.getElementById('template').value = templateValue;});



