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
fcopy['id']       = '';
fcopy['url']      = '';
fcopy['title']    = '';
fcopy['author']   = '';

/**
 * Checking Platform for NewLine
 * @type {string}
 */
var nL = "\n";

function gotPlatformInfo(info) {
    if (info.os == 'winnt') {
        nL = "\r\n";
    };
}

var gettingInfo = browser.runtime.getPlatformInfo();
gettingInfo.then(gotPlatformInfo);

/**
 * Templates for generating copyright file
 */
const astTemplate = "Foto ID: {ID}"+nL+nL+"Title: {TITLE}"+nL+nL+"URL: {URL}"+nL+nL+"Copyright info: {AUTHOR} – stock.adobe.com";

const pxbTemplate = "Foto ID: {ID}"+nL+nL+"Title: {TITLE}"+nL+nL+"URL: {URL}"+nL+nL+"Copyright info: Image by {AUTHOR} on Pixabay";

var template = '';

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
    var copyrights = '';

    if (url.search(/^https:\/\/pixabay\.com/) != -1) {
        copyrights = pxbTemplate;
        parsePxbCopyrights(data, url);
    } else if (url.search(/^https:\/\/stock\.adobe\.com/) != -1) {
        copyrights = astTemplate;
        parseAstCopyrights(data, url);
    }

    if (fcopy['id'] != '' &&
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

    var blob = new Blob([copyrights], { type: 'text/plain' });

    fcopyDownloadUrl = (window.webkitURL || window.URL).createObjectURL(blob);

    var downloading = browser.downloads.download({
        url : fcopyDownloadUrl,
        filename : fcopy['id'] + '_copyright.txt',
        saveAs: true
    });

    downloading.then(function(id){console.log('OK')}, function(error){console.log('error')});
}

/**
 * Parse credits out of url and html body content
 */
function parseAstCopyrights(data, url)
{
    const urlPattern = /^([^\?]+)(\?.*)?$/
    if (url.search(urlPattern) != -1) {
        fcopy['url'] = url.match(urlPattern)[1];
    } else {
        fcopy['url'] = url;
    }

    const idPattern = /^https:\/\/stock\.adobe\.com\/[a-z]+\/images\/[^\/]+\/([1-9][0-9]*).*$/
    if (url.search(idPattern) != -1) {
        fcopy['id'] = url.match(idPattern)[1];
    }

    const authorPattern = /^.*<a class=".+" href=".+" data-ingest-clicktype="details-contributor-link">([^<>]+)<\/a>.*$/mi;
    if (data.search(authorPattern) != -1) {
        fcopy['author'] = data.match(authorPattern)[1].trim();
    }

	const titlePattern = /^.*<h1[^>]*>[^<>]*<span[^>]*>([^<>]+)<\/span>[^<>]*<\/h1>.*$/mi;
    if (data.search(titlePattern) != -1) {
        fcopy['title'] = data.match(titlePattern)[1].trim();
    }
}

/**
 * Parse credits out of url and html body content
 */
function parsePxbCopyrights(data, url)
{
    const urlPattern = /^([^\?]+)(\?.*)?$/
    if (url.search(urlPattern) != -1) {
        fcopy['url'] = url.match(urlPattern)[1];
    } else {
        fcopy['url'] = url;
    }

    const idPattern = /^.+srcset="https:\/\/cdn\.pixabay\.com\/photo\/[0-9]+\/[0-9]+\/[0-9]+\/[0-9]+\/[0-9]+\/([a-z-]+-[0-9]+)_.+$/mi;
    if (data.search(idPattern) != -1) {
        fcopy['id'] = data.match(idPattern)[1];
    }

    const authorPattern = /^.*<a [^>]+>([a-zA-Z0-9_ \r\n-]+) \/ [0-9]+ [a-zA-Z \r\n]+<\/a>.*$/mi;
    if (data.search(authorPattern) != -1) {
        fcopy['author'] = data.match(authorPattern)[1].trim();
    }

    const titlePattern = /^.*<title>([0-9a-zA-ZäÄüÜöÖß -]+) - [^<]+<\/title>.*$/mi;
    if (data.search(titlePattern) != -1) {
        fcopy['title'] = data.match(titlePattern)[1].trim();
    }
}
