
room.js
-------

Overview
--------

The room.js library is a DSL that removes most of the $.ajax boilerplate
and replaces it with a function chain which closely resembles the path of 
the resources to be accessed. It is best shown with an example:

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

Or perhaps you would like to add a new comment to a post with id == 4, then
the code would be:

```javascript
  $room.posts(4).comments().create( { /* comment data */ },
    function(data) {
      // what to do on success
    },
    function(xhr) {
      // what to do on failure
    });
```

The DSL allows for calling create, read, update, destroy, and list on any
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
  var commentsForPost5 = $room.posts(5).comments
  
  users(10).destroy(); // destroys user 10 without caring for callbacks
  posts().create({ name: 'new post', text: '...' }); // makes a new post
  
  // logs all the comments for the post with id 5
  commentsForPost5.list(function(data) { console.log(data); });
```