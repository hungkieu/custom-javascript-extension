_('#nav-script-list').on('click', function() {
  activeScreen('#screen-script-list');
});

_('#nav-create').on('click', function() {
  activeScreen('#screen-new-script');
});

_('#screen-new-script-submit').on('click', function() {
  let id_object = _('#screen-new-script-id');
  let name_object = _('#screen-new-script-name');
  let js_object = _('#screen-new-script-js');
  let role_object = _('#screen-new-script-role');

  let id = id_object.val();  
  let name = name_object.val();  
  let js = js_object.val();
  let role = role_object.find('input[name=role]:checked').val();

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (role == 'only') {
      const tab = tabs[0];
      const url = new URL(tab.url);

      role = url.host;
    }

    if (isPresent(id)) {
      updateScript(id, { id, name, js, role });
    } else {
      id = uniqId();
      createScript({ id, name, js, role });
    }

    id_object.val('');  
    name_object.val('');
    js_object.val('');
    role_object.find('input[name=role]')[0].checked = true;

    activeScreen('#screen-script-list');
  });
});

_('#screen').on('activescreen', async function(e) {
  if(e.detail == '#screen-script-list') {
    let scripts = getData();
    if(isBlank(scripts)) return;

    let screen_script_list_index_element = _('#screen-script-list-index')[0];
    screen_script_list_index_element.innerHTML = '';

    const tab = await chromeGetCurrentTab();
    const url = new URL(tab.url);
    const host = url.host;

    scripts
      .filter(function(script) {
        return script.role == 'all' || script.role == host
      })
      .forEach(function(script) {
        let div = document.createElement('div');
        div.classList.add('script');
        div.textContent = script.name;
        div.dataset.id = script.id;

        screen_script_list_index_element.append(div);
      });
  }
});

_('#screen-script-list-index').on('click', function(e) {
  if(e.target.dataset.id) {
    _('#screen-script-list-index').find('.active').removeClass('active');
    _(e.target).addClass('active');
  }
});

_('window').on('click', function(e) {
  if(!e.target.dataset.id && e.target.parentNode.id != 'screen-script-list-index') {
    _('#screen-script-list-index').find('.active').removeClass('active');
  }
});

_('#screen-script-list-delete').on('click', function() {
  const activeScriptElement = _('#screen-script-list-index').find('.active');

  if(isBlank(activeScriptElement))
    return;

  const id = activeScriptElement.data('id');
  
  destroyScript(id);

  activeScreen('#screen-script-list');
});

_('#screen-script-list-show').on('click', function() {
  const activeScriptElement = _('#screen-script-list-index').find('.active');

  if(isBlank(activeScriptElement))
    return;
  
  const id = activeScriptElement.data('id');
  const script = findScript(id);
  activeScreen('#screen-new-script');

  let id_object = _('#screen-new-script-id');
  let name_object = _('#screen-new-script-name');
  let js_object = _('#screen-new-script-js');
  let role_object = _('#screen-new-script-role');

  id_object.val(id);  
  name_object.val(script.name);  
  js_object.val(script.js);
  
  if(script.role == 'all') {
    role_object.find('input')[1].checked = true;
  }
});

_('#screen-script-list-run').on('click', function() {
  const activeScriptElement = _('#screen-script-list-index').find('.active');

  if(isBlank(activeScriptElement))
    return;

  const id = activeScriptElement.data('id');
  const script = findScript(id);

  if(isBlank(script.js)) return;

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {message: 'run-script', js: script.js});
  });
});

activeScreen('#screen-script-list');
