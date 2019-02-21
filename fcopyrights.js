/**
 * An add-on for creating text files with copyright infos for Stock photos
 *
 */
browser.contextMenus.create({
    id: "fcopyrights",
    title: "Get Copyright Info",
    contexts: ["all"]
});

browser.contextMenus.onClicked.addListener(function(info, tab) {
    browser.tabs.query({active: true, currentWindow: true}).then( tabs => {
        browser.tabs.sendMessage( tabs[0].id, {'req':'get-source-code'}).then( response => {
            handleClick(response.content, tabs[0].url);
        });
    });
});

/**
 * fcopyDownloadUrl should be revoked, after successful download
 */
var fcopyDownloadUrl;
function handleDownloadsChanged(delta) {
    if (delta.state && delta.state.current === "complete") {
        (window.webkitURL || window.URL).revokeObjectURL(fcopyDownloadUrl);
    }
}
browser.downloads.onChanged.addListener(handleDownloadsChanged);

/*
 * Array with copyright infos
 */
var fcopy = new Array();
fcopy['id']       = 0;
fcopy['url']      = '';
fcopy['title']    = '';
fcopy['author']   = '';

/**
 * Template for generating copyright file
 */
var nL = "\n";
//console.log( browser.runtime.getBrowserInfo() );
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
function handleClick(data, url)
{
    var copyrights = template;

    parseCopyrights(data, url);

    if (fcopy['id'] > 0 &&
        fcopy['author'] != '' &&
        fcopy['url'] != '' &&
        fcopy['title'] != '') {
        
        let tempKeys = Object.keys(fcopy);
        for(let i = 0; i < tempKeys.length; i++) {
            let pattern = new RegExp("\{" + tempKeys[i].toUpperCase() + "\}", "m");
            copyrights = copyrights.replace(pattern, fcopy[tempKeys[i]]);
        };
        
    } else {
        return false;
    }


    var text = "ID: " + fcopy['id'] + "Author: " + fcopy['author'];

    var blob = new Blob([text], { type: 'text/plain' });

    fcopyDownloadUrl = (window.webkitURL || window.URL).createObjectURL(blob);

    var downloading = browser.downloads.download({
        url : fcopyDownloadUrl,
        filename : fcopy['ID'] + '.txt',
        saveAs: true
    });

    downloading.then(function(id){console.log('OK')}, function(error){console.log('error')});
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
