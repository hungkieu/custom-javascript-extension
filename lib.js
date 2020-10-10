function isBlank(o) {
  if(
    o == undefined ||
    o == null ||
    o == false ||
    (Array.isArray(o) && o.length == 0) ||
    (typeof o === 'string' && o.trim() == '') ||
    (o.toString() == '[object myConstructor]' && o.elements.length == 0)
  )
    return true

  return false
}

function isPresent(o) {
  return !isBlank(o);
}

function isCallback(cb) {
  return isPresent(cb) && typeof cb === 'function';
}

function isNotCallback(cb) {
  return !isCallback(cb);
}

function isDOMElement(o) {
  return o && o instanceof Element;
}

var _ = (function() {

  var __querySelector = function(selector) {
    if (isBlank(selector)) {
      this.elements = undefined;
    } else if (selector === 'document') {
			this.elements = [document];
		} else if (selector === 'window') {
			this.elements = [window];
    } else if (isDOMElement(selector)) {
      this.elements = [selector];
		} else {
			this.elements = document.querySelectorAll(selector);
		}
  }

  var __setIndex = function() {
    if (isBlank(this.elements))
      return;

    for(let i = 0; i < this.elements.length; i++) {
      this[i] = this.elements[i];
    }
  }

  var __loop = function(callback) {
    if(isNotCallback(callback)) return;
    for(let i = 0; i < this.elements.length; i++) {
      callback(this.elements[i], i);
    }
  }

  var Constructor = function(selector) {
    __querySelector.call(this, selector);
    __setIndex.call(this);

    this.selector = selector;
  }

  Constructor.prototype.find = function(selector) {
    return _(this.selector + ' ' + selector);
  }

  Constructor.prototype.on = function(event, callback) {
    if(isNotCallback(callback)) return;

    __loop.call(this, function(element) {
      element.addEventListener(event, callback);
    });

    return this;
  }

  Constructor.prototype.addClass = function(className) {
    __loop.call(this, function(element) {
      if (element.classList)
        element.classList.add(className);
    });

    return this;
  }

  Constructor.prototype.removeClass = function(className) {
    __loop.call(this, function(element) {
      if (element.classList)
        element.classList.remove(className);
    });

    return this;
  }

  Constructor.prototype.val = function(value) {
    if(this.elements.length > 1 || this.elements.length == 0)
      return undefined;

    if(value == undefined && this.elements.length == 1)
      return this[0].value;

    if(value != undefined && this.elements.length == 1)
      this[0].value = value;
    
    return value;
  }

  Constructor.prototype.toString = function() {
    return "[object myConstructor]"
  }

  Constructor.prototype.data = function(key) {
    if(this.elements.length > 1 || this.elements.length == 0)
      return undefined;
    
    return this[0].dataset[key];
  }

  var instantiate = function (selector) {
		return new Constructor(selector);
	};

  return instantiate;
})();

function activeScreen(selector) {
  _('#screen > .active').removeClass('active');
  _(selector).addClass('active');

  const event = new CustomEvent('activescreen', { detail: selector });
  _('#screen')[0].dispatchEvent(event);
}

function saveData(data) {
  localStorage.setItem('data', JSON.stringify(data));
}

function getData() {
  return JSON.parse(localStorage.getItem('data'));
}

function uniqId() {
  return Math.random().toString(16).slice(2) + Date.now();
}

function updateScript(id, data) {
  var scripts = getData();
  if(isBlank(scripts)) return;

  var index = scripts.findIndex(function(element) {
    return element.id === id;
  });

  scripts.splice(index, 1, { id, ...data });
  saveData(scripts);
}

function createScript(data) {
  var scripts = getData();

  if(isBlank(scripts)) {
    scripts = [];
  }

  scripts.push(data);
  saveData(scripts);
}

function destroyScript(id) {
  var scripts = getData();
  if(isBlank(scripts)) return;

  var index = scripts.findIndex(function(element) {
    return element.id === id;
  });

  scripts.splice(index, 1);
  saveData(scripts);
}

function findScript(id) {
  var scripts = getData();
  if(isBlank(scripts)) return;

  var index = scripts.findIndex(function(element) {
    return element.id === id;
  });

  return scripts[index];
}

function chromeGetCurrentTab() {
  return new Promise(function(resolve) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      resolve(tabs[0]);
    });
  });
}
