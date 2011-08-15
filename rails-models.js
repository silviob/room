(function($) {
  $.models = {};
  $('meta').each(function (i, element) {
    if($(element).data('railsModel')) {
      var type = element.content;
      var typeCollection = $(element).data('railsCollection');
      $.models[type] = {};
      $.models[type].get = function(id, success, failure) {
      $.read('/{types}/{id}', {types: typeCollection,
                                 id: id},
          function(response) {
            data = [];
            success(response[type]);
          },
          failure);
      };
      $.models[type].list = function(success, failure) {
        $.read('/{types}', {types: typeCollection},
          function(response) {
            data = [];
            for(i in response) {
              data.push(response[i][type]);
            }
            success(data);
          },
          failure);
      };
      $.models[type].destroy = function(id, success, failure) {
        $.destroy('/{types}/{id}', {types: typeCollection,
                                 id: id},
          success,
          failure);
      };
      $.models[type].create = function(data, success, failure) {
        var options = {types: typeCollection};
        options[type] = data;
        $.create('/{types}', options,
          function(response) {
            success(response[type]);
          },
          failure);
      };
    };
  })
})(jQuery);
