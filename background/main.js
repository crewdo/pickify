chrome.browserAction.onClicked.addListener(function(tab) {
    requestImageForInjector(tab);
});

chrome.extension.onMessage.addListener(function(req, sender, sendResponse) {
    if(req.type === 'recaptureTab') {
		requestImageForInjector(sender.tab);
    }
    return;
});

function requestImageForInjector(tab){
    chrome.tabs.executeScript(tab.id, {file: "/injector/lightweight.js"}, function() {
      chrome.tabs.captureVisibleTab(null, {}, (imageUri) => {
         chrome.tabs.sendMessage(tab.id, {type: 'returnCapturedImageData', data: imageUri});
      });
    })
}