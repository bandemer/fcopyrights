/**
 * WebExtension for creating text files with copyright infos for stock photos
 * currently supports Fotolia, Adobe Stock and Pixabay
 */

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
var fcopy = [];
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
    if (info.os == 'win') {
        nL = "\r\n";
    };
}

var gettingInfo = browser.runtime.getPlatformInfo();
gettingInfo.then(gotPlatformInfo);

/**
 * Templates for generating copyright file
 */
const astTemplate = "Foto-ID: {ID}{NL}{NL}Title: {TITLE}{NL}{NL}URL: {URL}{NL}{NL}Copyright info: {AUTHOR} – stock.adobe.com";

const pxbTemplate = "Foto-ID: {ID}{NL}{NL}Title: {TITLE}{NL}{NL}URL: {URL}{NL}{NL}Copyright info: Image by {AUTHOR} on Pixabay";

const ftlTemplate = "Foto-ID: {ID}{NL}{NL}Title: {TITLE}{NL}{NL}URL: {URL}{NL}{NL}Copyright info: © {AUTHOR} - Fotolia.com";

/**
 * Handler for download click
 */
function handleClick(data, url)
{
    var copyrights = '';

    if (url.search(/^https:\/\/pixabay\.com/) != -1) {
        copyrights = pxbTemplate;
        fcopy = parsePxbCopyrights(data, url);
    } else if (url.search(/^https:\/\/stock\.adobe\.com/) != -1) {
        copyrights = astTemplate;
        fcopy = parseAstCopyrights(data, url);
    } else if (url.search(/^https:\/\/[a-z]+\.fotolia\.com/) != -1) {
        copyrights = ftlTemplate;
        fcopy = parseFtlCopyrights(data, url);
    }

    if (fcopy['id'] != '' &&
        fcopy['author'] != '' &&
        fcopy['url'] != '' &&
        fcopy['title'] != '') {

        fcopy['nl'] = nL;

        let tempKeys = Object.keys(fcopy);
        for(let i = 0; i < tempKeys.length; i++) {
            let pattern = new RegExp("\{" + tempKeys[i].toUpperCase() + "\}", "mg");
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

    downloading.then(function(id){ }, function(error){ });
}

/**
 * Parse credits out of url and html body content
 */
function parseAstCopyrights(data, url)
{
    var rA = [];
    rA['url']    = '';
    rA['id']     = '';
    rA['author'] = '';
    rA['title']  = '';

    const urlPattern = /^([^\?]+)(\?.*)?$/
    if (url.search(urlPattern) != -1) {
        rA['url'] = url.match(urlPattern)[1];
    } else {
        rA['url'] = url;
    }

    const idPattern = /^https:\/\/stock\.adobe\.com\/[a-z]+\/images\/[^\/]+\/([1-9][0-9]*).*$/
    if (url.search(idPattern) != -1) {
        rA['id'] = url.match(idPattern)[1];
    }

    const authorPattern = /^.*<a class=".+" href=".+" data-ingest-clicktype="details-contributor-link">([^<>]+)<\/a>.*$/mi;
    if (data.search(authorPattern) != -1) {
        rA['author'] = data.match(authorPattern)[1].trim();
    }

	const titlePattern = /^.*<h1[^>]*>[^<>]*<span[^>]*>([^<>]+)<\/span>[^<>]*<\/h1>.*$/mi;
    if (data.search(titlePattern) != -1) {
        rA['title'] = data.match(titlePattern)[1].trim();
    }
    return rA;
}

/**
 * Parse credits out of url and html body content
 */
function parsePxbCopyrights(data, url)
{
    var rA = [];
    rA['url']    = '';
    rA['id']     = '';
    rA['author'] = '';
    rA['title']  = '';

    const urlPattern = /^([^\?]+)(\?.*)?$/
    if (url.search(urlPattern) != -1) {
        rA['url'] = url.match(urlPattern)[1];
    } else {
        rA['url'] = url;
    }

    const idPattern = /^.+srcset="https:\/\/cdn\.pixabay\.com\/photo\/[0-9]+\/[0-9]+\/[0-9]+\/[0-9]+\/[0-9]+\/([a-z-]+-[0-9]+)_.+$/mi;
    if (data.search(idPattern) != -1) {
        rA['id'] = data.match(idPattern)[1];
    }

    const authorPattern = /^.*<a [^>]+>([a-zA-Z0-9_ \r\n-]+) \/ [0-9]+ [a-zA-Z \r\n]+<\/a>.*$/mi;
    if (data.search(authorPattern) != -1) {
        rA['author'] = data.match(authorPattern)[1].trim();
    }

    const titlePattern = /^.*<title>([0-9a-zA-ZäÄüÜöÖß -]+) - [^<]+<\/title>.*$/mi;
    if (data.search(titlePattern) != -1) {
        rA['title'] = data.match(titlePattern)[1].trim();
    }

    return rA;
}

/**
 * Parse credits out of url and html body content
 */
function parseFtlCopyrights(data, url)
{
    var rA = [];
    rA['url']    = '';
    rA['id']     = '';
    rA['author'] = '';
    rA['title']  = '';

    const urlPattern = /^([^\?]+)(\?.*)?$/
    if (url.search(urlPattern) != -1) {
        rA['url'] = url.match(urlPattern)[1];
    } else {
        rA['url'] = url;
    }

    const idPattern = /^https:\/\/[a-z]*\.fotolia\.com\/id\/([1-9][0-9]*).*$/
    if (url.search(idPattern) != -1) {
        rA['id'] = url.match(idPattern)[1];
    }

    const authorPattern = /^.*href="\/p\/[0-9]+">([^<]+)<\/a>.*$/mi;
    if (data.search(authorPattern) != -1) {
        rA['author'] = data.match(authorPattern)[1].trim();
    }

    const titlePattern = /^.*<h1 class="h-strong content-title truncate">([^<]+)<\/h1>.*$/mi;
    if (data.search(titlePattern) != -1) {
        rA['title'] = data.match(titlePattern)[1].trim();
    }

    return rA;
}

/**
 * Handle click
 */
browser.pageAction.onClicked.addListener(() => {
    browser.tabs.query({active: true, currentWindow: true}).then( tabs => {
        browser.tabs.sendMessage( tabs[0].id, {'req':'get-source-code'}).then( response => {
            handleClick(response.content, tabs[0].url);
        });
    });
});