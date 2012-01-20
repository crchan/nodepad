/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    mongoose = require('mongoose'),
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


// Routes
app.get('/', function(req, res) {
  res.redirect('/documents')
});

// List
app.get('/documents.:format?', function(req, res) {
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

app.get('/documents/:id.:format?/edit', function(req, res) {
    Document.findById(req.params.id, function(err, d) {
        res.render('documents/edit.jade', {
            locals: { d: d }
        });
    });
});

app.get('/documents/new', function(req, res) {
    res.render('documents/new.jade', {
        locals: { d: new Document() }
    });
});
 
// Create
app.post('/documents.:format?', function(req, res) {
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
app.get('/documents/:id.:format?', function(req, res) {
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
app.put('/documents/:id.:format?', function(req, res) {
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
app.del('/documents/:id.:format?', function(req, res) {
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

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

