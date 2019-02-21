/*
 * Get source code of current Tab
 */
browser.runtime.onMessage.addListener(request => {
    var response = '';
    if(request.req === 'get-source-code') {
        response = document.documentElement.innerHTML;
    }
    return Promise.resolve({content: response});
});