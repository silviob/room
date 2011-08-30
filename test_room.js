(function() {

  QUnit.config.reorder = false;
  QUnit.config.noglobals = true;

  module('Testing Room');
  
  var success = function() {
    var expectedArguments = arguments;
    return function(stuff) {
      ok(true, 'success callback called');
      ok(arguments.length >= expectedArguments.length,
                                'got as many arguments as expected');
      for(var i = 0; i < expectedArguments.length; i++) {
        var expectedArgument = expectedArguments[i];
        var gottenArgument = arguments[i]
        for(var key in expectedArgument) {
          equal(gottenArgument[key], expectedArgument[key]);
        }
      }
      start();
    }
  };

  var failure = function() {
    ok(false, 'failure callback called');
    start();
  };

  $.room().enterLoopbackMode();
  $.room().addResource('grandfather', { path: 'grandfathers',
                                        type: 'grandfather' });
  $.room().addResource('grandmother', { path: 'grandmothers',
                                        type: 'grandmother' });


  var data = { name: 'Xavier' };
  var createdId = -1;
  asyncTest('creating a root', function() {
    $.room().grandfathers().create(data,
      function(response) {
        createdId = response.id;
        (success(data)(response));
      }, 
      failure);
  });

  asyncTest('reading the root', function() {
    $.room().grandfathers(2).read(success(data), failure);
  });

  asyncTest('creates independent contexts', function() {
    var grandfathers2 = $.room().grandfathers(2);
    // creating another context 
    $.room().grandmothers().create({}, function() {}, function() {}); 
    grandfathers2.read(success(data), failure);
  });

  asyncTest('destroying the root', function() {
    $.room().grandfathers(2).destroy(success(data), failure);
  });

  asyncTest('fails when trying to destroy a non-existent resource', function() {
    $.room().grandfathers('this-resource-doesnt-exist').destroy(failure, success());
  });


}())
