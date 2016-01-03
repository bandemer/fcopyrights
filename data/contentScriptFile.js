/**
 * ContentScriptFile
 */
window.addEventListener('click', function(event) {
    if (event.target.id == 'fcopyrightsdownload') {
        self.port.emit('getCopyrightFile');
    }
}, false);

const fcreditsPattern = /([a-z]+: #[0-9]+ \| [a-z]+: <a[^>]* href="\/p\/[0-9]+">[^<]+<\/a>)/i;
var html = document.body.innerHTML;
if (html.search(fcreditsPattern) != -1) {
    html = html.replace(fcreditsPattern, "$1 <a href=\"#\" id=\"fcopyrightsdownload\">Download Copyrights</a>");
    document.body.innerHTML = html;
}


