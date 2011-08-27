(function($) {

  var inner = {};
  var resources = {};
  var currentPath = '';
  var currentType = null;
  var loopbackStore = { data: {}, parent: null };

  var printStore = function(store, level) {
    store = store || loopbackStore;
    level = level || '';
    for(var i in store.data) {
      console.log(level + i);
      printStore(store.data[i], level + '  ');
    }
  }

  var identity = function(data) { 
    return data;
  };

  var railsSinglePack = function(data) {
    var payload = {};
    payload[this.type] = data;
    return payload;
  }

  var railsSingleUnpack = function(data) {
    return data[this.type];
  }

  var railsListUnpack = function(response) {
    var data = [];
    for(var i in response) {
       data.push(response[i][currentType]);
    }
    return data;
  }

  inner.extension = "json";
  
  inner.configurePackData = function(config) {
    inner.packData = {};
    inner.packData.create = config == 'rails' ? railsSinglePack
                                              : identity;
    inner.packData.update = config == 'rails' ? railsSinglePack
                                              : identity;

    inner.unpackData = {};
    inner.unpackData.create  = config == 'rails' ? railsSingleUnpack
                                                 : identity;
    inner.unpackData.read    = config == 'rails' ? railsSingleUnpack
                                                 : identity;
    inner.unpackData.update  = config == 'rails' ? railsSingleUnpack
                                                 : identity;
    inner.unpackData.destroy = config == 'rails' ? railsSingleUnpack
                                                 : identity;
    inner.unpackData.list    = config == 'rails' ? railsListUnpack
                                                 : identity;
  }
  inner.configurePackData('rails');

  inner.updateDataFilter = identity;
  inner.destroyDataFilter = identity;

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
    switch(options.type.toLowerCase()) {
    case 'post':
      var store = getOrCreateLeaf(options.url, loopbackStore, true);
      var stored = 0;
      for(var i in store) { stored++ };
      store.data[stored] = makeLeaf(options.data, store);
      options.success(store.data[stored].data);
      break;
    case 'get':
      var store = getOrCreateLeaf(options.url, loopbackStore, true);
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

  var getAndClearPath = function() {
    var path = currentPath;
    currentPath = '';
    return path;
  }

  var create = function(data, success, failure) {
    var options = { type: currentType };
    inner.ajax({
      url: getAndClearPath() + '.' + inner.extension,
      data: inner.packData.create.
                     call(options, data),
      type: 'post',
      success: function(response) {
        success(inner.unpackData.create.
                     call(options, response));
      },
      error: failure
    });
  };

  var read = function(success, failure) {
    var options = { type: currentType };
    inner.ajax({
      url: getAndClearPath() + '.' + inner.extension,
      success: function(response) {
        success(inner.unpackData.read.
                     call(options, response));
      },
      error: failure
    });
  };

  var update = function(data, success, failure) {
    var options = { type: currentType };
    inner.ajax({
      url: getAndClearPath() + '.' + inner.extension,
      data: inner.packData.update.
                     call(options, data),
      type: 'put',
      success: function(response) {
        success(inner.unpackData.update.
                     call(options, response));
      },
      error: failure
    });
  };

  var destroy = function(success, failure) {
    var options = { type: currentType };
    inner.ajax({
      url: getAndClearPath() + '.' + inner.extension,
      type: 'delete',
      success: function(response) {
        success(inner.unpackData.destroy.
                     call(options, response));
      },
      error: failure
    });
  };

  var list = function(success, failure) {
    var options = { type: currentType };
    inner.ajax({
      url: getAndClearPath() + '.' + inner.extension,
      success: function(response) {
        success(inner.unpackData.list.
                     call(options, response));
      },
      error: failure
    });
  };

  $.room = function() {
    getAndClearPath();
    return inner;
  };

  inner.addResource = function(name, path, parent, type) {
    var resource = function(id) {
      var idPart = id !== undefined ? '/' + id : '';
      currentPath += '/' + path + idPart;
      currentType = type;
      return resource;
    }
    resource.create = create;
    resource.read = read;
    resource.update = update;
    resource.destroy = destroy;
    resource.list = list;
    resources[name] = resource;
    if(parent) {
      resources[parent][type] = resource;
    } else {
      inner[type] = resource;
    }
  };

  inner.initFromMetaTags = function() {
    $('meta').each(function (i, element) {
      if($(element).data('room-resource')) {
        var name = element.name;
        var type = element.content;
        var path = $(element).data('room-path');
        var parent = $(element).data('room-parent');
        inner.addResource(name, path, parent, type);
      }
    });
  };

})(jQuery);

$.room().initFromMetaTags();
