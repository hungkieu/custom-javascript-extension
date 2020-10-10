function injectScript(actualCode) {
  var script = document.createElement('script');
  script.textContent = actualCode;
  document.body.appendChild(script);
  script.remove();
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if(request.message == 'run-script')
      injectScript(request.js);
  }
);
