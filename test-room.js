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

  $room().enterLoopbackMode();
  $room().configurePackData('identity');
  $room().addResource('grandfather', { path: 'grandfathers',
                                        type: 'grandfather' });
  $room().addResource('grandmother', { path: 'grandmothers',
                                        type: 'grandmother' });
  $room().addResource('father', { path:   'fathers',
                                   type:   'father',
                                   parent: 'grandfather' });

  var data = { name: 'Xavier' };
  var createdId = -1;
  asyncTest('creating a root', function() {
    $room().grandfathers().create(data,
      function(response) {
        createdId = response.id;
        (success(data)(response));
      }, 
      failure);
  });

  test('we have an id', function() {
    ok(createdId != undefined && createdId != -1, 'createdId shouldnt be -1: ' + createdId);
  });

  asyncTest('reading the root', function() {
    $room().grandfathers(createdId).read(success(data), failure);
  });

  asyncTest('creates independent contexts', function() {
    var grandfathers2 = $room().grandfathers(createdId);
    // creating another context 
    $room().grandmothers().create({}, function() {}, function() {}); 
    grandfathers2.read(success(data), failure);
  });

  asyncTest('can override the root path', function() {
    $room({ path: '/some-other-root' }).grandfathers(createdId).
                                             read(failure, success());
  });

  asyncTest('can create a child', function() {
    var father = { name: 'some father name' };
    $room().grandfathers(createdId).fathers().create(father, success(father), failure);
  });

  asyncTest('can create a child with a detached context', function() {
    var father = { name: 'some father name' };
    var grandpa = $room().grandfathers(createdId);
    grandpa.fathers().create(father, success(father), failure);
  });

  asyncTest('can create a child with a detached factory', function() {
    var father = { name: 'some father name' };
    var fathers = $room().grandfathers(createdId).fathers;
    fathers().create(father, success(father), failure);
  });

  asyncTest('destroying the created grandfather', function() {
    $room().grandfathers(createdId).destroy(success(data), failure);
  });

  asyncTest('creating 10 grandmothers', function() {
    for(var i = 0; i < 9; i++) {
      $room().grandmothers().create({}, function() {}, failure);
    }
    $room().grandmothers().create({}, success(), failure);
  });

  asyncTest('listing the recently created grandmothers', function() {
    $room().grandmothers().list(function(data) {
      ok(data.length > 10, 'should be at least 10');
      (success()());
    },
    failure);
  });

  var nana = { name: 'Nana' };
  var nanaId = 5;
  asyncTest('updating a grandmother', function() {
    $room().grandmothers(nanaId).update(nana, success(nana), failure);
  });

  asyncTest('ensuring the update took place', function() {
    $room().grandmothers(nanaId).read(success(nana), failure);
  });

  asyncTest('fails when trying to read a non-existent resource', function() {
    $room().grandfathers('this-resource-doesnt-exist').read(failure, success());
  });

  asyncTest('fails when trying to update a non-existent resource', function() {
    $room().grandfathers('this-resource-doesnt-exist').update({}, failure, success());
  });

  asyncTest('fails when trying to destroy a non-existent resource', function() {
    $room().grandfathers('this-resource-doesnt-exist').destroy(failure, success());
  });

}())
