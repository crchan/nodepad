/**
 * Module dependencies.
 */

var util = require("util"),
    express = require('express'),
    routes = require('./routes'),
    mongoose = require('mongoose'),
    mongoStore = require('connect-mongodb'),
    db,
    User,
    Document;

var app = module.exports = express.createServer();


// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({ store: mongoStore(app.set('db-uri')), secret: 'topsecret' }));
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  app.use(express.logger({ format: '\x1b[1m:method\x1b[0m \x1b[33m:url\x1b[0m :response-time ms' }));
});

app.configure('development', function(){
  app.set('db-uri', 'mongodb://localhost/nodepad-development');
  app.use(express.errorHandler({ dumpExceptions: true })); 
});

app.configure('production', function(){
  app.set('db-uri', 'mongodb://localhost/nodepad');
});

app.configure('test', function() {
  app.set('db-uri', 'mongodb://localhost/nodepad-test');
});


// Db
db = mongoose.connect(app.set('db-uri'));
app.Document = Document = require('./models.js').Document(db);
app.User = User = require('./models.js').User(db);


// 로그인 확인
function loadUser(req, res, next) {
  if (req.session.user_id) {
    User.findById(req.session.user_id, function(user) {
      if (user) {
        req.currentUser = user;
        next();
      } else {
        res.redirect('/sessions/new');
      }
    });
  } else {
    res.redirect('/sessions/new');
  }
}


// Routes
app.get('/', function(req, res) {
  res.redirect('/documents')
});

// List
app.get('/documents.:format?', loadUser, function(req, res) {
  Document.find({}, function(err, documents) {
    switch (req.params.format) {
      case 'json':
        res.send(documents.map(function(d) {
          console.log(d.__doc);
          return d.__doc;
        }));
        break;
      default:
        res.render('documents/index.jade', {
          locals: {documents: documents }
        });
    }
  });
});

app.get('/documents/:id.:format?/edit', loadUser, function(req, res) {
    Document.findById(req.params.id, function(err, d) {
        res.render('documents/edit.jade', {
            locals: { d: d }
        });
    });
});

app.get('/documents/new', loadUser, function(req, res) {
    res.render('documents/new.jade', {
        locals: { d: new Document() }
    });
});
 
// Create
app.post('/documents.:format?', loadUser, function(req, res) {
  var document = new Document(req.body['document']);
  document.save(function(err) {
    switch (req.params.format) {
      case 'json':
        res.send(document.__doc);
        break;
      default:
        res.redirect('/documents');
    }
  });
});
 
// Read
app.get('/documents/:id.:format?', loadUser, function(req, res) {
  Document.findById(req.params.id, function(err, d) {
    switch (req.params.format) {
      case 'json':
        res.send(d);
        break;
      default:
        res.render('documents/show.jade', {
          locals: { d: d }
        });
    }
  });
});
 
// Update
app.put('/documents/:id.:format?', loadUser, function(req, res) {
  Document.findById(req.body.document.id, function(err, d) {
    d.title = req.body.document.title;
    d.data = req.body.document.data;
    d.save(function(err) {
      switch (req.params.format) {
        case 'json':
          res.send(d.__doc);
          break;
        default:
          res.redirect('/documents');
      }
    });
  });
});
 
// Delete
app.del('/documents/:id.:format?', loadUser, function(req, res) {
  Document.findById(req.params.id, function(err, d) {
    d.remove(function(err) {
      switch (req.params.format) {
        case 'json':
          res.send('true');
          break;
        default:
          res.redirect('/documents');
      }
    });
  });
});

// 사용자 추가
app.get('/users/new', function(req, res) {
  res.render('users/new.jade', {
    locals: { user: new User() }
  })
});

app.post('/users.:format?', function(req, res) {
  var user = new User(req.body.user);

  function userSaveFailed() {
    res.render('users/new.jade', {
      locals: { user: user }
    });
  }

  // 문서 저장
  user.save(function(err) {
    if(err) return userSaveFailed();

    switch(req.params.format) {
      case 'json':
        res.send(user.__doc);
        break;

      default:
        req.session.user_id = user.id;  // 세션에 user id 추가
        res.redirect('/documents');
    }
  });
});

// Login 페이지
app.get('/sessions/new', function(req, res) {
  res.render('sessions/new.jade', {
    locals: { user: new User() }
  });
});
 
// Login 처리
app.post('/sessions', function(req, res) {
  User.findOne({ email: req.body.user.email }, function(err, user){
    if(user && user.authenticate(req.body.user.password)) {
      req.session.user_id = user.email;
      res.redirect('/documents');
    } else {
      // Login 페이지로
      res.redirect('/sessions/new');
    }
  })
});
 
 // 세션 제거
app.del('/sessions', loadUser, function(req, res) {
  if (req.session) {
    req.session.destroy(function() {});
  }
  res.redirect('/sessions/new');
});


app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);