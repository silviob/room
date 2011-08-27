(function($) {

  var inner = {};
  var resources = {};
  var currentPath = '';
  var currentType = null;
  var loopbackStore = { data: {}, parent: null };

  var identity = function(data) { 
    return data;
  };

  inner.extension = "json";
  
  inner.createDataFilter = identity;
  inner.updateDataFilter = identity;
  inner.destroyDataFilter = identity;

  var getOrCreateLeaf = function(path, store) {
//    console.log(path);
    var parts = path.split('/');
    var zeroth = parts[0];
    parts = parts.slice(1);
    if(zeroth === '') return getOrCreateLeaf(parts.join('/'), store);
    if(!store.data[zeroth]) store.data[zeroth] = { data: {}, parent: store };
    if(parts.length == 0) return store.data[zeroth];
    return getOrCreateLeaf(parts.join('/'), store.data[zeroth]);
  }

  var loopback = function(options) {
    var re = new RegExp('\.' + inner.extension + '$');
    options.url = options.url.replace(re, '');
    options.type = options.type || 'get';
    switch(options.type.toLowerCase()) {
    case 'post':
      var store = getOrCreateLeaf(options.url, loopbackStore);
      var stored = 0;
      for(var i in store) { stored++ };
      store.data[stored] = { data: $.extend(true, {}, options.data) };
      options.success(store.data[stored].data);
      break;
    case 'get':
      var store = getOrCreateLeaf(options.url, loopbackStore);
      options.success(store.data);
      break;
    case 'delete':
      var store = getOrCreateLeaf(options.url, loopbackStore);
      var id = options.url.slice(options.url.lastIndexOf('/') + 1);
      var data = 
      delete parent[id];
      options.success();
      break;
    }
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
    var payload = {};
    payload[currentType] = data;
    inner.ajax({
      url: getAndClearPath() + '.' + inner.extension,
      data: inner.createDataFilter(payload),
      type: 'post',
      beforeSend: inner.beforeSendCreate,
      success: function(response) {
        success(response[currentType]);
      },
      error: failure
    });
  };

  var read = function(success, failure) {
    inner.ajax({
      url: getAndClearPath() + '.' + inner.extension,
      success: function(response) {
        var data = [];
        success(response[currentType]);
      },
      error: failure
    });
  };

  var update = function(data, success, failure) {
    var payload = {};
    payload[currentType] = data;
    inner.ajax({
      url: getAndClearPath() + '.' + inner.extension,
      data: inner.updateDataFilter(payload),
      type: 'put',
      success: function(response) {
        success(response[currentType]);
      },
      error: failure
    });
  };

  var destroy = function(success, failure) {
    inner.ajax({
      url: getAndClearPath() + '.' + inner.extension,
      data: inner.destroyDataFilter({}),
      type: 'delete',
      success: success,
      error: failure
    });
  };

  var list = function(success, failure) {
    inner.ajax({
      url: getAndClearPath() + '.' + inner.extension,
      success: function(response) {
        var data = [];
        for(var i in response) {
          data.push(response[i][currentType]);
        }
        success(data);
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
