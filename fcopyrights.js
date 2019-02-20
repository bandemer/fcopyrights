/**
 * An add-on for creating text files with copyright infos for Fotolia photos
 *
 */

browser.contextMenus.create({
    id: "fcopyrights",
    title: "Get Copyright Info",
    contexts: ["all"]
});


browser.contextMenus.onClicked.addListener(function(info, tab) {
    browser.tabs.query({active: true, currentWindow: true}).then( tabs => {
        browser.tabs.sendMessage( tabs[0].id, {'req':'source-code'}).then( response => {
            handleClick(response.content, tabs[0].url);
        });
    });

});

/*
 * Array with copyright infos
 */
var fcopy = new Array();
fcopy['ID']       = 0;
fcopy['URL']      = '';
fcopy['TITLE']    = '';
fcopy['AUTHOR']   = '';

/**
 * Template for generating copyright file
 */
var nL = "\n";
/*if (syst.platform == 'winnt') {
    nL = "\r\n";
}
*/
const defaultTemplate = "Fotolia ID: {ID}"+nL+nL+"Title: {TITLE}"+nL+nL+"URL: {URL}"+nL+nL+"Copyright info:"+nL+nL+"© {AUTHOR} - Fotolia.com";
var template = defaultTemplate;
/*if (store.storage.template) {
    template = store.storage.template;
}
*/

/**
 * Adding preference for file template
 */
/*pref.on('template', function() {
    tabs.open({
        url: self.data.url('template.html'), 
        onReady: function(tab) {
            let worker = tab.attach({
                contentScriptFile: self.data.url('contentScriptFileTemplate.js'),         
            });
            worker.port.on('save', function(templateString) {
                if (syst.platform == 'winnt') {
                    templateString = templateString.replace(/\n/gm, '\r\n');
                }            
                store.storage.template = template = templateString; 
            });
            worker.port.on('default', function() { worker.port.emit('setTemplate', defaultTemplate); });
            worker.port.on('exit', function() { tab.close(); });
            worker.port.emit('setTemplate', template);
        }
    });
});
*/



/**
 * Handler for download click
 */
function handleClick(data, url) {

    var copyrights = template;

    console.log(url);

    parseCopyrights(data, url);
    console.log(fcopy);

    if (fcopy['ID'] > 0 && 
        fcopy['AUTHOR'] != '' &&
        fcopy['URL'] != '' &&  
        fcopy['TITLE'] != '') {
        
        let tempKeys = Object.keys(fcopy);
        for(let i = 0; i < tempKeys.length; i++) {
            let pattern = new RegExp("\{" + tempKeys[i] + "\}", "m");
            copyrights = copyrights.replace(pattern, fcopy[tempKeys[i]]);
        };
        
    } else {
        return false;
    }
}

/**
 * Parse credits out of url and html body content
 */
function parseCopyrights(data, url) 
{
    const urlPattern = /^([^\?]+)(\?.*)?$/
    if (url.search(urlPattern) != -1) {
        fcopy['URL'] = url.match(urlPattern)[1];
    } else {
        fcopy['URL'] = url;
    }

    const idPattern = /^https:\/\/stock\.adobe\.com\/[a-z]+\/images\/[^\/]+\/([1-9][0-9]*).*$/
    if (url.search(idPattern) != -1) {
        fcopy['ID'] = url.match(idPattern)[1];
    }

    const authorPattern = /^.*<a class=".+" href=".+" data-ingest-clicktype="details-contributor-link">([^<>]+)<\/a>.*$/mi;
    if (data.search(authorPattern) != -1) {
        fcopy['AUTHOR'] = data.match(authorPattern)[1].trim();
    }

	const titlePattern = /^.*<h1[^>]*>[^<>]*<span[^>]*>([^<>]+)<\/span>[^<>]*<\/h1>.*$/mi;
    if (data.search(titlePattern) != -1) {
        fcopy['TITLE'] = data.match(titlePattern)[1].trim();
    }
}


