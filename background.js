browser.contextMenus.create({
    id: "fcopyrights",
    title: "Get Copyright Info",
    contexts: ["all"]
});

browser.contextMenus.onClicked.addListener(function(info, tab) {
    console.log('test');
});