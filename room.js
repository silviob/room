(function($) {

  var inner = {};
  var resources = {};
  
  inner.ajax = jQuery.ajax;
  
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
       data.push(response[i][this.type]);
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

  var getPath = function() {
    return this.path + '.' + inner.extension;
  };

  var wrapSuccess = function(type, successCallback, options) {
    return function(response) {
      successCallback(inner.unpackData[type].
                     call(options, response));
    };
  };

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

  $.room = function() {
    return inner;
  };

  inner.addResource = function(name, data) {
    var path = data.path;
    var parent = data.parent;
    var type = data.type;
    var resource = function(id) {
      var idPart = id !== undefined ? '/' + id : '';
      var localPath = '/' + path + idPart;
      var context = $.extend({}, resource);
      context.path = this.path ? this.path : '' + localPath;
      return context;
    }
    $.extend(resource, data);
    resource.create = create;
    resource.read = read;
    resource.update = update;
    resource.destroy = destroy;
    resource.list = list;
    resource.getPath = getPath;
    resources[name] = resource;
    if(parent) {
      resources[parent][path] = resource;
    } else {
      inner[path] = resource;
    }
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

}(jQuery));

$.room().initFromMetaTags();
