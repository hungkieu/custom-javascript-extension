var currentTab;

function chromeGetCurrentTab() {
  if(!chrome.tabs) return Promise.resolve();

  return new Promise(function(resolve) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      resolve(tabs[0]);
    });
  });
}

function saveData(data) {
  if(chrome && chrome.storage) {
    storage_data = data.filter(function(script) {
      return script.run_at_start;
    });

    chrome.storage.local.set({data: JSON.stringify(storage_data)});
  }
  localStorage.setItem('data', JSON.stringify(data));
}

function getData() {
  return JSON.parse(localStorage.getItem('data')) || [];
}

function uniqId() {
  return Math.random().toString(16).slice(2) + Date.now();
}

function findIndexScript(id, scripts) {
  return scripts.findIndex(function(element) {
    return element.id === id;
  });
}

function updateScript(id, data) {
  var scripts = getData();
  var index = findIndexScript(id, scripts);
  scripts.splice(index, 1, { id, ...data });
  saveData(scripts);
}

function createScript(data) {
  var scripts = getData();
  var id = uniqId();
  scripts.push({ id, ...data });
  saveData(scripts);
}

function destroyScript(id) {
  var scripts = getData();
  var index = findIndexScript(id, scripts);
  scripts.splice(index, 1);
  saveData(scripts);
}

function findScript(id) {
  var scripts = getData();
  var index = findIndexScript(id, scripts);
  return scripts[index];
}

function turnOffAllScreen() {
  _('#screens > div.active').class('active', {all: true});
}

function turnOnScreen(id) {
  turnOffAllScreen();
  _(id).class('active');
}

function groupByScope(scripts) {
  var result = {};
  var host = 'all';
  if (currentTab) {
    var url = new URL(currentTab.url);
    var host = url.host;
  }

  scripts.forEach(function(script) {
    if (!result[script.scope]) {
      result[script.scope] = {
        name: script.scope == 'all' ? "Tất cả" : script.scope,
        list: [script],
        level: {'all': 1, [host]: 2}[script.scope] || 0
      }
    } else {
      result[script.scope].list.push(script);
    }
  });

  return result;
};

function renderScripts() {
  var scripts = groupByScope(getData());
  var html = '';

  Object.keys(scripts)
    .sort(function (a, b) {
      if(scripts[a].level < scripts[b].level) return 1;
      if(scripts[a].level > scripts[b].level) return -1;
      return 0;
    })
    .forEach(function(key) {
      var script = scripts[key];
      html += `
        <p class="menu-label">
          ${script.name}
        </p>
        <ul class="menu-list">
      `;

      script.list.forEach(function(i) {
        html += `
          <li class="script" data-id="${i.id}">
            <a data-id="${i.id}">
              ${i.name}
              <div>
                <button data-id="${i.id}" data-action="run" class="button is-success"><strong>Chạy</strong></button>
                <button data-id="${i.id}" data-action="edit" class="button is-info"><strong>Sửa</strong></button>
                <button data-id="${i.id}" data-action="delete" class="button is-danger"><strong>Xoá</strong></button>
              </div>
            </a>
          </li>
        `
      });

      html += `</ul>`;
    });

  _('#screen-1-menu')[0].innerHTML = html;
}

chromeGetCurrentTab().then(function(tab) {
  currentTab = tab;
});

renderScripts();

// Event: go_to_screen
// Desc: Kích hoạt sự kiện này khi muốn chuyển màn hình
// Argument:
// - id
_.on('go_to_screen', function(id) {
  turnOnScreen(id);
  renderScripts();
});

_('#screen-1-them-moi').on('click', function() {
  _.emit('go_to_screen', '#screen-2');
});

_('#screen-2-huy').on('click', function() {
  _.emit('go_to_screen', '#screen-1');
});

_('#screen-2-luu').on('click', function() {
  var name_element = _('#screen-2-name');
  var script_element = _('#screen-2-script');

  var id = _('#screen-2-id').prop('value');
  var name = name_element[0].value;
  var script = script_element[0].value;
  var scope = _('#screen-2 [name=scope]:checked')[0].value;

  if(scope == 'Others' && currentTab) {
    tab = currentTab;
    const url = new URL(tab.url);
    scope = url.host || 'Others';
  }

  var run_when_load_page = _('#screen-2-run-when-load-page')[0].checked;
  
  var data = {
    name,
    script,
    scope,
    run_at_start: run_when_load_page
  }

  name_element[0].value = '';
  script_element[0].value = '';
  _('#screen-2-domain')[0].checked = true;
  _('#screen-2-run-when-load-page')[0].checked = false;
  _('#screen-2-id')[0].value = '';

  if (id)
    updateScript(id, data);
  else
    createScript(data);

  _.emit('go_to_screen', '#screen-1');
});

_('#screen-1-menu').on('click', function(e) {
  e.preventDefault();
  
  var id;
  var action;
  var path = e.path;
  for(let i = 0; i < path.length; i++) {
    if(path[i].tagName == "BODY") break;
    if(_(path[i]).data('id')) {
      id = _(path[i]).data('id');
      if(id && _(path[i]).data('action'))
        action = _(path[i]).data('action');
      break;
    }
  }

  if (id) {
    if(_('li.script[data-id="' + id +'"] > a').class() == 'is-active') {
      _('li.script[data-id="' + id +'"] > a').class('is-active');
    } else {
      _('li.script > a.is-active').class('is-active', { remove: true, all: true });
      _('li.script[data-id="' + id +'"] > a').class('is-active');
    }
  }

  if (action == 'edit') {
    _.emit('go_to_screen', '#screen-2');
    var script = findScript(id);
    _('#screen-2-id').prop('value', script.id);
    _('#screen-2-name')[0].value = script.name;
    _('#screen-2-script')[0].value = script.script;
    _('#screen-2-run-when-load-page')[0].checked = script.run_at_start;
    script.scope == 'all' ? _('#screen-2-all')[0].checked = true : _('#screen-2-domain')[0].checked
  }

  if (action == 'delete') {
    var conf = confirm('Xác nhận xoá script!!');
    if (!conf) return;

    destroyScript(id);
    renderScripts();
  }

  if(action == 'run') {
    const script = findScript(id);

    if(!script || !script.script) return;

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {message: 'run-script', js: script.script});
    });
  }
});
