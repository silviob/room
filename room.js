(function($) {

  /**
   This function creates contexts, which encapsulate all of the configuration
   and state of the function chain. Contexts inherit all of the properties of
   the factory, and they get a calculated path fragment, which will come into
   play when calling any of the CRUDL functions.
  **/
  var createContextFactory = function(path) {
    var factory = function() {
      var context = function(id) {
        var existingPath = (context.previous && context.previous.path) ? 
                                                 context.previous.path : '';
        var idPart = id !== undefined ? '/' + id : '';
        var localPath = path === '' ? '' : '/' + path + idPart;
        context.path = existingPath + localPath;
        return context;
      };
      $.extend(context, factory);
      for(var i in context) {
        if(context[i].isFactory) {
          context[i] = context[i]();
          context[i].previous = context;
        }
      }
      return context;
    };
    factory.isFactory = true;
    return factory;
  };

  // State

  var inner = createContextFactory('');


  // Public API

  $room = function(configuration) {
    configuration = configuration ? configuration : {};
    var context = inner();
    context.previous = configuration;
    $.extend(context, configuration);
    return context();
  };
  $room.inner = inner;

  inner.addResource = function(path, data) {
    var pathParts = path.split('/');
    var parent = inner;
    var current = undefined;
    for(var i in pathParts) {
      if(pathParts[i] == '' || pathParts[i][0] == '{')
        continue;
      current = pathParts[i];
      if(parent[current]) parent = parent[current];
    }
    var resource = createContextFactory(current);
    $.extend(resource, data);
    resource.create = create;
    resource.read = read;
    resource.update = update;
    resource.destroy = destroy;
    resource.list = list;
    resource.getPath = getPath;
    parent[current] = resource;
  };

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
  };

  inner.initFromMetaTags = function() {
    $('meta[content=room-resource]').each(function (i, element) {
      var name = element.name;
      var type = element.content;
      var data = {};
      for(var attribute in element.attributes) {
        var attrName = element.attributes[attribute].name;
        var re = new RegExp('^data-');
        if(attrName && attrName.match(re)) {
          data[attrName.replace(re, '')] =
                                element.attributes[attribute].value;
        }
      }
      inner.addResource(name, data);
    });
  };


// CRUD

  var create = function(data, success, failure) {
    var url = this.getPath();
    inner.ajax({
      url: url,
      data: inner.packData.create.
                     call(this, data),
      type: 'post',
      success: wrapSuccess('create', success, this),
      error: failure
    });
  };

  var read = function(success, failure) {
    var url = this.getPath();
    inner.ajax({
      url: url,
      success: wrapSuccess('read', success, this),
      error: failure
    });
  };

  var update = function(data, success, failure) {
    inner.ajax({
      url: this.getPath(),
      data: inner.packData.update.
                     call(this, data),
      type: 'put',
      success: wrapSuccess('update', success, this),
      error: failure
    });
  };

  var destroy = function(success, failure) {
    inner.ajax({
      url: this.getPath(),
      type: 'delete',
      success: wrapSuccess('destroy', success, this),
      error: failure
    });
  };

  var list = function(success, failure) {
    inner.ajax({
      url: this.getPath(),
      success: wrapSuccess('list', success, this),
      error: failure
    });
  };

// Helper functions

  var identity = function(data) { 
    return data;
  };

  var railsSinglePack = function(data) {
    var payload = {};
    payload[this.type] = data;
    return payload;
  };

  var railsSingleUnpack = function(data) {
    return data[this.type];
  };

  var railsListUnpack = function(response) {
    var data = [];
    for(var i in response) {
       data.push(response[i][this.type]);
    }
    return data;
  };

  var getPath = function() {
    return this.path + '.' + inner.extension;
  };

  var wrapSuccess = function(type, successCallback, options) {
    return function(response) {
      successCallback(inner.unpackData[type].
                     call(options, response));
    };
  };

// Initialization

  inner.ajax = $.ajax;
  inner.extension = "json";
  inner.configurePackData('rails');
  inner.initFromMetaTags();

}(jQuery));
