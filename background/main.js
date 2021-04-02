chrome.browserAction.onClicked.addListener(function(tab) {
    requestImageForInjector(tab);
});

chrome.extension.onMessage.addListener(function(req, sender, senderResponse) {
    if(req.action === 'recaptureTab') {
		  requestImageForInjector(sender.tab);
    }
    senderResponse(1);

});

function requestImageForInjector(tab){
    chrome.tabs.executeScript(tab.id, {file: "/injector/lightweight.js"}, function() {
      chrome.tabs.captureVisibleTab(null, {}, (imageUri) => {
         chrome.tabs.sendMessage(tab.id, {action: 'returnCapturedImageData', data: imageUri});
      });
    })
}