
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

  var testModel = function(name, model,
                                   createModel,
                                   updateModel) {
    module("Testing Model " + name)

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

})();


