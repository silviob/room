
(function() {

  QUnit.config.reorder = false;

  var fail = function(msg) { ok(false, msg) };

  var failure = function() {
    fail("shouldn't get here");
    start();
  };

  var success = function() {
    ok(true, "successfully ran");
    start();
  }

  var asyncTry = function(unsafe) {
    try {
      unsafe();
    } catch (e) {
      fail("raised unexpected exception: " + e);
      start();
    }
  };

  var logOut = function() {
    $.read('/users/sign_out', success, failure);
  };

  var ensureLoggedIn = function(username, password) {
    var updateAuthToken = function() {
      $.read('/authenticity_token.json', {},
        // Not sure why even tho the request succeeds, the infrastructure
        // calls the error callback. Sigh.
        failure,
        function(xhr, headers) {
          $.restSetup.csrfToken = encodeURIComponent(xhr.responseText);
          ok(true, "auth token: " + xhr.responseText);
          ok(true, "csrf token: " + $.restSetup.csrfToken);
          success();
        });
    };
    var options = { user: {} };
    options.user.email = username;
    options.user.password = password;
    options.user.remember_me = 1;
    $.read('/users/sign_out',
      function() {
        $.create('/users/sign_in.json', options,
          function(data, headers, xhr) {
            ok(true, 'successfully logged in: ' + username);
            updateAuthToken();
          },
          function(xhr, headers) {
            options.user.password_confirmation = password;
            $.create('/users.json', options,
              function() {
                ok(true, 'successfully created new user: ' + username);
                updateAuthToken();
              },
              failure);
          });
      },
      failure);
  }

  var testModel = function(name, model,
                                   createModel,
                                   updateModel) {
    module("Testing Model " + name);

    asyncTest("login in testdude", function() {
      ensureLoggedIn('testdude@test.com', 'password');
    });

    var modelData = createModel();
    var createdModel = null;
    asyncTest("creating an instance", function() {
      model.create(modelData,
        function(newlyCreated) {
          asyncTry(function() {
            for(i in modelData) {
              equals(newlyCreated[i], modelData[i], "the data matches");
            }
            ok(true, "successfully created an instance");
            createdModel = newlyCreated;
            success();
          });
        },
        failure);
    });

    asyncTest("we can list the model", function() {
      model.list(
        function(data) {
          asyncTry(function() {
            ok(data, "returned data is not null");
            success();
          });
        },
        failure
      );
    });

    var leftOvers = [];
    asyncTest("finding leftovers", function() {
      model.list(
        function(data) {
          asyncTry(function() {
            ok(data, "we found some data");
            for(i in data) {
              leftOvers.push(data[i]);
            };
            success();
          });
        },
        failure);
    });

    asyncTest("destroying leftovers", function() {
      var current;
      if(leftOvers.length == 0) success();
      while(leftOvers.length > 0) {
        current = leftOvers[0];
        leftOvers = leftOvers.splice(1, leftOvers.length - 1);
        stop();
        model.destroy(current.id, success, failure);
      }
      success();
    });

    var modelData = createModel();
    var createdModel = null;
    asyncTest("creating an instance", function() {
      model.create(modelData,
        function(newlyCreated) {
          asyncTry(function() {
            for(i in modelData) {
              equals(newlyCreated[i], modelData[i], "the data matches");
            }
            ok(true, "successfully created an instance");
            createdModel = newlyCreated;
            success();
          });
        },
        failure);
    });

    asyncTest("retrieving the created instance", function() {
      model.get(createdModel.id,
        function(found) {
          asyncTry(function() {
            for(i in createdModel) {
              equal(found[i], createdModel[i], "checking found to created");
            }
            success();
          });
        },
        failure
      );
    });

    asyncTest("updating the created instance", function() {
      var newData = updateModel(createdModel);
      model.update(createdModel.id, newData,
        function(updated) {
          asyncTry(function() {
            for(i in newData) {
              equal(newData[i], createdModel[i], "checking new data to the updated model");
            }
            success();
          });
        },
        failure
      );
    });

    asyncTest("login in testdudetwo", function() {
      ensureLoggedIn('testdudetwo@test.com', 'password');
    });

    asyncTest("can read another user's model", function() {
      model.get(createdModel.id, success, failure);
    });

    asyncTest("cannot destroy another user's model", function() {
      model.destroy(createdModel.id, failure, success);
    });

    asyncTest("cannot update another user's model", function() {
      model.update(createdModel.id, updateModel(createdModel),
                                              failure, success);
    });
  }


  var createExercise = function() {
    return { name: "A new Exercise!" };
  };
  var updateExercise = function(original) {
    original.name = "A different name for the same Exercise";
    return original;
  };
  testModel("Exercise", $.models.exercise, createExercise, updateExercise);


  var createRoutine = function() {
    return { name: "A new Routine!" };
  };
  var updateRoutine = function(original) {
    original.name = "A different name for the same Routine";
    return original;
  };
  testModel("Routine", $.models.routine, createRoutine, updateRoutine);

  var createWorkout = function() {
    return { current_exercise_id: 3 };
  };
  var updateWorkout = function(original) {
    original.current_exercise_id = 7;
    return original;
  };
  testModel("Workout", $.models.workout, createWorkout, updateWorkout);

})();