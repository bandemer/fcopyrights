/**
 * An add-on for creating text files with copyright infos for Fotolia photos
 *
 */
const tabs = require('sdk/tabs');
const self = require('sdk/self');
const pref = require('sdk/simple-prefs');
var store  = require('sdk/simple-storage');

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
const defaultTemplate = "Fotolia ID: {ID}\n\nTitle: {TITLE}\n\nURL: {URL}\n\nCopyright info:\n\n© {AUTHOR} - Fotolia.com";
var template = defaultTemplate;
if (store.storage.template) {
    template = store.storage.template;
}

/**
 * Adding preference for file template
 */
pref.on('template', function() {
    tabs.open({
        url: self.data.url('template.html'), 
        onReady: function(tab) {
            let worker = tab.attach({
                contentScriptFile: self.data.url('contentScriptFileTemplate.js'),         
            });
            worker.port.on('save', function(templateString) { store.storage.template = template = templateString; });
            worker.port.on('default', function() { worker.port.emit('setTemplate', defaultTemplate); });
            worker.port.on('exit', function() { tab.close(); });
            worker.port.emit('setTemplate', template);
        }
    });
});

/**
 * Adding worker to tab
 */
tabs.on('ready', function(tab) {
    if (tab.url.search(/fotolia\.com\/id\/[1-9][0-9]*/) != -1) {
        let worker = tab.attach({
            contentScriptFile: self.data.url("contentScriptFile.js"),
        });
        worker.port.on("getCopyrightFile", function(data){ handleClick(data, tab.url); });
    } 
});


/**
 * Handler for download click
 */
function handleClick(data, url) {

    var copyrights = template;

    parseCopyrights(data, url);

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

    const utils = require('sdk/window/utils'),
        base64 = require('sdk/base64'),
        {Cc, Cu, Ci} = require("chrome");

    Cu.import("resource://gre/modules/Downloads.jsm");
    Cu.import("resource://gre/modules/osfile.jsm")
    Cu.import("resource://gre/modules/Task.jsm");
    

    const nsIFilePicker = Ci.nsIFilePicker;
    var window = utils.getMostRecentBrowserWindow();

    var fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);

    fp.init(window, "Save as..", nsIFilePicker.modeSave);
    fp.defaultString = 'Fotolia_' + fcopy['ID'] + '_Copyright.txt';

    var rv = fp.show();
    if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {

        Task.spawn(function* () {

            let dl = yield Downloads.createDownload({
                source: "data:text/plain;base64," + base64.encode(copyrights, "utf-8"),
                target:  fp.file.path,
            });

            let list = yield Downloads.getList(Downloads.ALL);
            list.add(dl);

            yield Promise.all([dl.start()]);
        });
    }
}

/**
 * Parse credits out of url and html body content
 */
function parseCopyrights(data, url) 
{
    fcopy['URL'] = url;    

    const idPattern = /^.+fotolia\.com\/id\/([1-9][0-9]*).*$/
    if (url.search(idPattern) != -1) {
        fcopy['ID'] = url.match(idPattern)[1];
    }

    const authorPattern = /^.*<dd><a href="\/p\/[1-9][0-9]*" title="[^"]+">([^<>]+)<\/a><\/dd>.*$/mi;
    if (data.search(authorPattern) != -1) {
        fcopy['AUTHOR'] = data.match(authorPattern)[1];
    }

	const titlePattern = /^.*<h1[^>]*>([^<>]+)<\/h1>.*$/mi;
    if (data.search(titlePattern) != -1) {
        fcopy['TITLE'] = data.match(titlePattern)[1];
    }
}


