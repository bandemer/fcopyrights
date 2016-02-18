/**
 * ContentScriptFile for adding download to fotolia details pages
 */
const fcreditsPattern = /([a-z]+: #[0-9]+ \| [a-z]+: <a[^>]* href="\/p\/[0-9]+">[^<]+<\/a>)/i;
var elements = document.getElementsByClassName('content-preview');
if (elements.length > 0) {
    var html = elements[0].innerHTML;
    if (html.search(fcreditsPattern) != -1) {
        html = html.replace(fcreditsPattern, "$1 <a id=\"fcopyrightsdownload\"> <span class=\"sp-16 ico-download\"></span>Download Copyrights</a>");
        elements[0].innerHTML = html;
    }
}

document.getElementById('fcopyrightsdownload').addEventListener('click', function(event) {
    self.port.emit('getCopyrightFile', document.body.innerHTML);
    return false;
}, false);
