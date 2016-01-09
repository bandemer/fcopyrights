/**
 * ContentScriptFile for modifieng Fotolia Details-Pages
 */
window.addEventListener('click', function(event) {
    if (event.target.id == 'fcopyrightsdownload') {
        self.port.emit('getCopyrightFile', document.body.innerHTML);
    } else {
        return true;
    }
}, false);

const fcreditsPattern = /([a-z]+: #[0-9]+ \| [a-z]+: <a[^>]* href="\/p\/[0-9]+">[^<]+<\/a>)/i;
var html = document.body.innerHTML;
if (html.search(fcreditsPattern) != -1) {
    html = html.replace(fcreditsPattern, "$1 <a href=\"#\" id=\"fcopyrightsdownload\"><span class=\"sp-16 ico-download\"></span> Download Copyrights</a>");
    document.body.innerHTML = html;
}


