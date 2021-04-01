chrome.browserAction.onClicked.addListener(function(tab) {
    requestImageForInjector(tab);
});

chrome.extension.onMessage.addListener(function(req, sender, acknowledgement) {
    if(req.action === 'recaptureTab') {
		  requestImageForInjector(sender.tab, acknowledgement);
    }
    return true;
});

function requestImageForInjector(tab, acknowledgement){
    chrome.tabs.executeScript(tab.id, {file: "/injector/lightweight.js"}, function() {
      chrome.tabs.captureVisibleTab(null, {}, (imageUri) => {
         chrome.tabs.sendMessage(tab.id, {action: 'returnCapturedImageData', data: imageUri}, function() {
              Promise.resolve("").then(result => acknowledgement());
         });
      });
    })
}