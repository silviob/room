
(function() {

  var inner = $.room();

  var loopbackStore = { data: {}, parent: null };

  inner.compose = function(f, g) {
    return function(data) {
      return f.call(this, g.call(this, data));
    };
  }

  var printStore = function(store, level) {
    store = store || loopbackStore;
    level = level || '';
    for(var i in store.data) {
      console.log(level + i);
      printStore(store.data[i], level + '  ');
    }
  }

  var makeLeaf = function(data, parent) {
    return { data: $.extend(true, {}, data),
             parent: parent};
  };

  var getOrCreateLeaf = function(path, store, enableCreate) {
    var parts = path.split('/');
    var zeroth = parts[0];
    parts = parts.slice(1);
    if(zeroth === '') return getOrCreateLeaf(parts.join('/'), store, enableCreate);
    if(enableCreate && !store.data[zeroth]) store.data[zeroth] = makeLeaf({}, store);
    if(parts.length == 0) return store.data[zeroth];
    return getOrCreateLeaf(parts.join('/'), store.data[zeroth], enableCreate);
  };

  var loopback = function(options) {
    var re = new RegExp('\.' + inner.extension + '$');
    options.url = options.url.replace(re, '');
    options.type = options.type || 'get';
    console.log('type: ' + options.type + ' url: ' + options.url);
    switch(options.type.toLowerCase()) {
    case 'post':
      var store = getOrCreateLeaf(options.url, loopbackStore, true);
      var stored = 0;
      for(var i in store) { stored++ };
      store.data[stored] = makeLeaf(options.data, store);
      store.data[stored].data.id = stored;
      options.success(store.data[stored].data);
      break;
    case 'get':
      var store = getOrCreateLeaf(options.url, loopbackStore, false);
      options.success(store.data);
      break;
    case 'delete':
      var store = getOrCreateLeaf(options.url, loopbackStore, false);
      if(!store) { 
        options.error();
      } else {
        var id = options.url.slice(options.url.lastIndexOf('/') + 1);
        var data = store.data;
        var parent = store.parent;
        if(parent.data[id] && delete parent.data[id])
          options.success(data);
        else
          options.error();
      }
      break;
    }
    printStore();
  }

  inner.enterLoopbackMode = function() {
    inner.ajax = loopback;
  }

  inner.leaveLoopbackMode = function() {
    inner.ajax = jQuery.ajax;
  }

  inner.leaveLoopbackMode();

}());
