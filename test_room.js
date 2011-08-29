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
  $.room().addResource('grandfather', { path: 'grandparents',
                                        type: 'grandfather' });

  var data = { name: 'Xavier' };
  var createdId = -1;
  asyncTest('creating a root', function() {
    $.room().grandparents().create(data,
      function(response) {
        createdId = response.id;
        (success(data)(response));
      }, 
      failure);
  });

  asyncTest('reading the root', function() {
    $.room().grandparents(2).read(success(data), failure);
  });

  asyncTest('destroying the root', function() {
    $.room().grandparents(2).destroy(success(data), failure);
  });

  asyncTest('fails when trying to destroy a non-existent resource', function() {
    $.room().grandparents('this-resource-doesnt-exist').destroy(failure, success());
  });

}())
