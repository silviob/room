(function($) {

  var resources = {};
  var currentPath = '';
  var currentType = null;

  var getAndClearPath = function() {
    var path = currentPath;
    currentPath = '';
    return path;
  }

  var create = function(data, success, failure) {
    var options = {};
    options[currentType] = data;
    $.create(getAndClearPath(), options,
      function(response) {
        success(response[currentType]);
      },
      failure);
  };

  var read = function(success, failure) {
    $.read(getAndClearPath(), {},
      function(response) {
        var data = [];
        success(response[currentType]);
      },
      failure);
  };

  var update = function(data, success, failure) {
    var options = {};
    options[currentType] = data;
    $.update(getAndClearPath(), options,
      function(response) {
        success(response[currentType]);
      },
      failure);
  };

  var destroy = function(success, failure) {
    $.destroy(getAndClearPath(), {},
      success,
      failure);
  };

  var list = function(success, failure) {
    $.read(getAndClearPath(), {},
      function(response) {
        var data = [];
        for(var i in response) {
          data.push(response[i][currentType]);
        }
        success(data);
      },
      failure);
  };

  $.room = {};

  $.room.addResource = function(name, path, parent, type) {
    var resource = function(id) {
      var idPart = id ? '/' + id : '';
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
      $.room[type] = resource;
    }
  };

  $.room.initFromMetaTags = function() {
    $('meta').each(function (i, element) {
      if($(element).data('room-resource')) {
        var name = element.name;
        var type = element.content;
        var path = $(element).data('room-path');
        var parent = $(element).data('room-parent');
        $.room.addResource(name, path, parent, type);
      }
    });
  };

})(jQuery);

$.room.initFromMetaTags();
