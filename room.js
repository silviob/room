(function($) {


  // Public API

  /*
   The global function used as namespace. It returns the root context
   for the call chain. Through the configuration object, one can override
   the root path by setting the 'path' attribute to the new value. The
   override will only affect the current call, and any derived contexts
   from it.
  */
  $room = function(configuration) {
    configuration = configuration ? configuration : {};
    var context = inner();
    context.previous = configuration;
    $.extend(context, configuration);
    return context();
  };

  /*
   Registers a new resource location. Path should contain an URI
   template, and the last path component should be the residence of
   the resource being registered. Data can contain metadata which
   will be available to the pack/unpack callbacks.
  */
  var addResource = function(path, data) {
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

  /*
   Your backend may expect your data payload to be 'packed' in a 
   particular fashion. If you want the application to handle objects
   which just carry the data, without having to worry about backend
   details, then you can configure room with a packer and an unpacker
   for each verb. Room will call those functions on the way to and
   from the server. If you want to care about the details, just call
   this function with the argument 'identity'.
  */
  var configurePackData = function(config) {
    inner.packData.create = config == 'rails' ? railsSinglePack
                                              : identity;
    inner.packData.update = config == 'rails' ? railsSinglePack
                                              : identity;

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

  /*
   Registers the resources into Room through meta tags. The tags have
   to have the content equal 'room-resource'. The name must be the path
   where the resource resides, as per the addResource function. Any
   data- HTML attributes will be passed to addResource as metadata.
  */
  var initFromMetaTags = function() {
    $('meta[content=room-resource]').each(function (i, element) {
      var path = element.name;
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
      inner.addResource(path, data);
    });
  };


// CRUD

  var create = function(data, success, failure) {
    var url = this.getPath();
    processXfer({
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
    processXfer({
      url: url,
      success: wrapSuccess('read', success, this),
      error: failure
    });
  };

  var update = function(data, success, failure) {
    processXfer({
      url: this.getPath(),
      data: inner.packData.update.
                     call(this, data),
      type: 'put',
      success: wrapSuccess('update', success, this),
      error: failure
    });
  };

  var destroy = function(success, failure) {
    processXfer({
      url: this.getPath(),
      type: 'delete',
      success: wrapSuccess('destroy', success, this),
      error: failure
    });
  };

  var list = function(success, failure) {
    processXfer({
      url: this.getPath(),
      success: wrapSuccess('list', success, this),
      error: failure
    });
  };


// Internals from here on

  /*
   This function creates a context factory. Context factories serve two
   purposes, one of them is to mark the object as being a factory. The
   other purpose is for the factory to carry all of the extra data that
   the user may specify when defining the resource. They do this by the
   mere fact of being an object.

   Contexts calculate the current path and add it to their path
   attribute. Also, they look at all their attributes and call all of
   the attributes which are also factories. After doing this, it goes
   ahead and registers itself as the 'previous' to the newly created
   context. This sounds rather serious and complicated, perhaps even
   overkill, but it buys us the rather nice property of being able to
   reuse any part of the function call chain way after the original call,
   and we can create two independent call chains with completely different
   originating contexts, which is kinda cool, and useful. Don't believe
   me? Check out how we are dynamically changing the path of the root
   in the tests.
  */
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
  inner.addResource = addResource;
  inner.configurePackData = configurePackData;
  inner.initFromMetaTags = initFromMetaTags;
  inner.packData = {};
  inner.unpackData = {};
  $room.inner = inner;
  var xferQ = [];

// Helper functions

  var wrapSuccess = function(type, successCallback, options) {
    return function(response) {
      successCallback(inner.unpackData[type].
                     call(options, response));
    };
  };

  var identity = function(data) { 
    return data;
  };

  var getPath = function() {
    return this.path + '.' + inner.extension;
  };

  var getXHR = (function() {
    var xhr;
    if(window.XMLHttpRequest)
      xhr = new XMLHttpRequest();
    else
      xhr = new ActiveXObject('Microsoft.XMLHTTP');
    return function() { return xhr; };
  }());

  var sendNext = function() {
    if(xferQ.length == 0) return;
    var spec = xferQ[0];
    xferQ.splice(0, 1);
    inner.ajax(spec);
  };

  var processXfer = (function() {
    var inFlight = 0;
    var sendChain = function() {
      inFlight--;
      if(inFlight > 0) sendNext();
    };
    return function(spec) {
      spec.xhr = getXHR;
      spec.complete = sendChain;
      xferQ.push(spec);
      inFlight++;
      if(inFlight == 1) {
        sendNext();
      }
    };
  }());

// Packers and unpackers that work with the way that Rails does JSON.

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


// Initialization

  inner.ajax = $.ajax;
  inner.extension = "json";
  inner.configurePackData('rails');
  inner.initFromMetaTags();

}(jQuery));
