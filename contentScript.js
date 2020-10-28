function injectScript(actualCode) {
  var script = document.createElement('script');
  script.textContent = '(function(){ ' + actualCode + ' })()';
  document.body.appendChild(script);
  script.remove();
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if(request.message == 'run-script')
      injectScript(request.js);
  }
);

window.onload = function() {
  chrome.storage.local.get('data', function(result) {
    try {
      const scripts = JSON.parse(result.data);
      if(scripts.length) {
        scripts.forEach(function(script) {
          if((script.script || script.script != '') && (script.scope == 'all' || script.scope == 'host'))
            injectScript(script.script);
        });
      }
    } catch(e) {
      console.log(`Extension error`);
    }
  });
}
