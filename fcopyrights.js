/**
 * WebExtension for creating text files with copyright infos for stock photos
 * currently supports Adobe Stock, Pixabay, Unsplash and Pexels
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
    }
}

var gettingInfo = browser.runtime.getPlatformInfo();
gettingInfo.then(gotPlatformInfo);

/**
 * Templates for generating copyright file
 */
const astTemplate = "File ID: {ID}{NL}{NL}Title: {TITLE}{NL}{NL}URL: {URL}{NL}{NL}Copyright info: {AUTHOR} – stock.adobe.com";

const pxbTemplate = "File ID: {ID}{NL}{NL}Title: {TITLE}{NL}{NL}URL: {URL}{NL}{NL}Copyright info: {AUTHOR} on Pixabay";

const uspTemplate = "File ID: {ID}{NL}{NL}Title: {TITLE}{NL}{NL}URL: {URL}{NL}{NL}Copyright info: {AUTHOR} on Unsplash";

const pexTemplate = "File ID: {ID}{NL}{NL}Title: {TITLE}{NL}{NL}URL: {URL}{NL}{NL}Copyright info: {AUTHOR} on Pexels";

/**
 * Handler for download click
 */
function handleClick(data, url)
{
    let copyrights = '';
    let website = '';
	 
    if (url.search(/^https:\/\/pixabay\.com/) != -1) {
        website = 'pixabay';
        copyrights = pxbTemplate;        
        fcopy = parsePxbCopyrights(data, url);
    } else if (url.search(/^https:\/\/stock\.adobe\.com/) != -1) {
        website = 'adobestock';
        copyrights = astTemplate;        
        fcopy = parseAstCopyrights(data, url);
    } else if (url.search(/^https:\/\/unsplash\.com/) != -1) {
        website = 'unsplash';
        copyrights = uspTemplate;        
        fcopy = parseUspCopyrights(data, url);
    } else if (url.search(/^https:\/\/www\.pexels\.com/) != -1) {
        website = 'pexels';
        copyrights = pexTemplate;
        fcopy = parsePexCopyrights(data, url);
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
        }
        
    } else {
        return false;
    }

    let blob = new Blob([copyrights], { type: 'text/plain' });

    fcopyDownloadUrl = (window.webkitURL || window.URL).createObjectURL(blob);

    let downloading = browser.downloads.download({
        url : fcopyDownloadUrl,
        filename : fcopy['id'] + '_' + website + '_copyright.txt',
        saveAs: true
    });

    downloading.then(function(id){ }, function(error){ });
}

/**
 * Parse credits out of url and html body content
 */
function parseAstCopyrights(data, url)
{
    let rA = [];
    rA['url']    = '';
    rA['id']     = '';
    rA['author'] = '';
    rA['title']  = '';

    const urlPattern = /^([^\?]+)(\?.*)?$/;
    if (url.search(urlPattern) != -1) {
        rA['url'] = url.match(urlPattern)[1];
    } else {
        rA['url'] = url;
    }

    const idPattern = /^https:\/\/stock\.adobe\.com\/([a-z]+\/)?[0-9a-z-]+\/[^\/]+\/([1-9][0-9]*).*$/;
    if (url.search(idPattern) != -1) {
        rA['id'] = url.match(idPattern)[2];
    }

    const authorPattern = /^.*<script type="application\/json" id="image-detail-json">(.*)<\/script>.*$/mi;
    if (data.search(authorPattern) != -1) {
        let imgObject = JSON.parse(data.match(authorPattern)[1].trim());
        rA['author'] = imgObject[rA['id']]["author"];
    }

	const titlePattern = /^.*<h1[^>]*>[^<>]*<span[^>]*>([^<>]+)<\/span>[^<>]*<\/h1>.*$/mi;
    if (data.search(titlePattern) != -1) {
        rA['title'] = data.match(titlePattern)[1].trim();
    }
    
    if (rA['title'] == '') {
		const altTitlePattern = /^.*<h1[^>]*>([^<]+)<.*$/mi;
		if (data.search(altTitlePattern) != -1) {
	        rA['title'] = data.match(altTitlePattern)[1].trim();
	    }
	}
   
    return rA;
}

/**
 * Parse Pixabay credits out of url and html body content
 */
function parsePxbCopyrights(data, url)
{
    let rA = [];
    rA['url']    = '';
    rA['id']     = '';
    rA['author'] = '';
    rA['title']  = '';

    const urlPattern = /^([^\?]+)(\?.*)?$/;
    if (url.search(urlPattern) != -1) {
        rA['url'] = url.match(urlPattern)[1];
    } else {
        rA['url'] = url;
    }

    const idPattern = /^.+<link rel="canonical" href="https:\/\/pixabay\.com\/([a-z]{2,2}\/)?[a-z-]+\/[^\/]+-([0-9]+)\/.+$/mi;
    if (data.search(idPattern) != -1) {
        rA['id'] = data.match(idPattern)[2];
    }

    const authorPattern = /^.*<a[^>]+class="userName[^>]+>([^<]+)<\/a>.*$/mi;
    if (data.search(authorPattern) != -1) {
        rA['author'] = data.match(authorPattern)[1].trim();
    }

    const titlePattern = /^.*<meta property="og:title" content="([^"]+)".*$/mi;
    if (data.search(titlePattern) != -1) {
        rA['title'] = data.match(titlePattern)[1].trim();
    }
 
    return rA;
}

/**
 * Parse Unsplash credits out of url and html body content
 */
function parseUspCopyrights(data, url)
{
    let rA = [];
    rA['url']    = '';
    rA['id']     = '';
    rA['author'] = '';
    rA['title']  = '';

    const urlPattern = /^([^\?]+)(\?.*)?$/;
    if (url.search(urlPattern) != -1) {
        rA['url'] = url.match(urlPattern)[1];
    } else {
        rA['url'] = url;
    }

    const idPattern = /^https:\/\/unsplash\.com\/([a-z-]{2,5}\/)?(photos|fotos|foto|fotografias|%E5%86%99%E7%9C%9F|%EC%82%AC%EC%A7%84)\/([^\/]+-)?([a-zA-Z0-9_]+).*$/i;
    if (url.search(idPattern) != -1) {
        rA['id'] = url.match(idPattern)[4];
    }
    const authorPattern = /^.*<meta property="og:title" content="(Foto von |Photo by |Foto de |Photo de |Foto di |Foto de |사진 작가: |Unsplashで)([^"]+)( auf Unsplash| on Unsplash|, Unsplash| en Unsplash| sur Unsplash| su Unsplash| na Unsplash|が撮影した写真)".*$/mi;
    if (data.search(authorPattern) != -1) {
        rA['author'] = data.match(authorPattern)[2];
    }

    const titlePattern = /^.*<title>([^<]+)–([^<]+)<\/title>.*$/mi;
    if (data.search(titlePattern) != -1) {
        rA['title'] = data.match(titlePattern)[1].trim();
    }

    return rA;
}

/**
 * Parse Pexels credits out of url and html body content
 */
function parsePexCopyrights(data, url)
{
    let rA = [];
    rA['url']    = '';
    rA['id']     = '';
    rA['author'] = '';
    rA['title']  = '';

    const urlPattern = /^([^\?]+)(\?.*)?$/;
    if (url.search(urlPattern) != -1) {
        rA['url'] = url.match(urlPattern)[1];
    } else {
        rA['url'] = url;
    }

    const idPattern = /^https:\/\/www\.pexels\.com(\/[a-z]{2}-[a-z]{2})?\/[^\/]+\/(([^\/]+)-)?([0-9]+)\/.*$/;
    if (url.search(idPattern) != -1) {
        rA['id'] = url.match(idPattern)[4];
    }

    const authorPattern = /^.*<a( rel="[^"]*")? class="[^"]*" href="(\/[a-z-]+)?\/@([a-z0-9-]+)\/">[^<]*<h5 class="[^"]*">([^<]+)<\/h5>[^<]*<\/a>.*$/mi;
    if (data.search(authorPattern) != -1) {
        rA['author'] = data.match(authorPattern)[4].trim();
    }

    const titlePattern = /^.*"name":"([^"]+)",.*$/mi;
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