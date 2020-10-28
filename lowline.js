var _ = (function() {
  const events = [];

  const __querySelector = function(selector, parent) {
    if (!selector) {
      this.elements = undefined;
    } else if (selector === 'document') {
			this.elements = [document];
		} else if (selector === 'window') {
			this.elements = [window];
    } else if (_.isElement(selector)) {
      this.elements = [selector];
		} else {
			this.elements = parent.querySelectorAll(selector);
		}
  }

  const __loop = function(callback) {
    for(let i = 0; i < this.elements.length; i++) {
      callback(this.elements[i], i);
    }
  }

  const LowLine = function(selector, props) {
    __querySelector.call(this, selector, props.parent);

    this.selector = selector;
    this[0] = this.elements[0];
  }

  LowLine.prototype.find = function(selector) {
    if (_.isElement(this.selector))
      return _(selector, this.selector);
    
    return _(this.selector + ' ' + selector);
  }

  LowLine.prototype.on = function(eventName, callback) {
    __loop.call(this, function(element) {
      element.addEventListener(eventName, callback, false);
    });

    return this;
  }

  LowLine.prototype.off = function(eventName, callback) {
    __loop.call(this, function(element) {
      element.removeEventListener(eventName, callback, false);
    });

    return this;
  }

  LowLine.prototype.class = function(
    className,
    options = {
      add: false,
      remove: false,
      force: false,
      all: false 
    }
  ) {
    const { force, all, add, remove } = options;
    if(!className || className == '') return this[0].className;

    const setClass = function(element) {
      if (force) {
        element.className = className;
      } else {
        className.split(' ').forEach(function(cn) {
          if(add) {
            element.classList.add(cn);
          } else if(remove) {
            element.classList.remove(cn);
          } else {
            element.classList.toggle(cn);
          }
        });
      }
    }

    if (all) {
      __loop.call(this, setClass);
    } else {
      setClass(this[0]);
    }

    return this;
  }

  LowLine.prototype.attr = function(attr, value) {
    if (!attr && !value) {
      const attributes = this[0].attributes;
      const result = {};

      Object.keys(attributes).forEach(function(key) {
        result[attributes[key].nodeName] = attributes[key].nodeValue;
      });

      return result;
    }

    if (_.isString(attr) && !value) {
      const element = this[0];
      const arr = attr.split(' ');
      const result = arr.map(function(key) {
        return {[key]: element.getAttribute(key) };
      });

      return arr.length == 1 ? result[0][arr] : result;
    }

    if (_.isString(attr) && value) {
      this[0].setAttribute(attr, value);
    }
    
    return this;
  }

  LowLine.prototype.prop = function(property, value) {
    if(value) {
      this[0][property] = value;
      return this;
    }

    return this[0][property];
  }

  LowLine.prototype.data = function(key, value) {
    key = key.replace(/-([a-z0-9])/g, function(match, group1, offset) {
      return offset > 0 ? group1.toUpperCase() : match;
    });

    if (value) {
      this[0].dataset[key] = value;
      return this;
    }

    return this[0].dataset[key];
  }

  const defaultProps = {
    parent: document
  }
  
  const init = function(selector, props = defaultProps) {
    return new LowLine(selector, props);
  }

  return init;
})();

(function test(_) {
  const type = {
    string: "[object String]",
    object: "[object Object]"
  }

  function getRawText(o) {
    return Object.prototype.toString.call(o);
  }

  _.isElement = function(o) {
    return o && o instanceof Element;
  }

  _.isString = function(o) {
    return o && getRawText(o) == type.string;
  }

  _.isObject = function(o) {
    return o && getRawText(o) == type.object;
  }
})(_);

(function customEvent(_) {
  const events = [];

  _.emit = function(eventName, context) {
    events.forEach(function(event) {
      if (event.name !== eventName)
        return;

      event.callback(context);
    });
  }
  
  _.on = function(event, callback){
    events.push({
      name: event,
      callback
    });
  }
})(_);
