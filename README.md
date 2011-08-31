**room.js**: _a library for all your REST needs._
================================================

Overview
--------

**Room** is a DSL that removes most of the $.ajax boilerplate and
replaces it with a function chain which closely mirrors the path of 
the resources to access. It is best shown with an example:

Let's say you need to read a resource located at:

```html
  http://mywebapp.com/posts/3/comments/2
```

The code would look like:

```javascript
  $room.posts(3).comments(2).read(
    function(data) {
      // what to do on success
    },
    function(xhr) {
      // what to do on failure
    });
```

Or perhaps you would like to add a new comment to the post resource with 
id == 4, then the code would be:

```javascript
  $room.posts(4).comments().create( { /* comment data */ },
    function(data) {
      // what to do on success
    },
    function(xhr) {
      // what to do on failure
    });
```

**Room** allows for calling create, read, update, destroy, and list on any
REST resource.

It is not necessary to use the full chain every time. The partial result
of an access chain can be reused multiple times. Again, an example should
make this concept clearer.

```html
  Assume the following resource URLs
  
  http://mywebapp.com/users
  http://mywebapp.com/posts
  http://mywebapp.com/posts/:id/comments
```

Then, we can create multiple isolated contexts to access each of the URLs
listed above. Like this:

```javascript
  var users = $room.users;
  var posts = $room.posts;
  var commentsForPost5 = $room.posts(5).comments;
  
  users(10).destroy(); // destroys user 10 without caring for callbacks
  posts().create({ name: 'new post', text: '...' }); // makes a new post
  
  // logs all the comments for the post with id 5
  commentsForPost5.list(function(data) { console.log(data); });
```

**Room** also offers advantages for testing. It can be put in test mode
which makes all of the requets to be serviced locally. In this way, the
tests can populate a local repository of objects that they can access
during the tests. The local repository can be populated with errors as
well as with data payload.

Using **Room**
--------------

   1.   Include `room.js` through a script tag or other loading method.
   2.   Configure **Room** through the `$room` global variable.
   3.   Tell **Room** about the resources that are available to your app.
   4.   Start issuing REST requests.
   
Dependencies
------------

**Room** dependes on jQuery. The test utils, which are defined in 
`room-test-utils.js` depend both in jQuery and in QUnit.

License
-------

**Room** is copyright 2011 by Silvio Brugada, released under the MIT License
(see LICENSE for details).