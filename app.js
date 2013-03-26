
/**
 * Dependencies
 */

var express =require('express'),
    app = express(),
    request = require('request'),
    redis = require('redis-url').connect(process.env.REDISTOGO_URL),
    cachey = require('cachey')({redisClient:redis}),
    db = new (require('./lib/db'))(cachey, 60 * 60);

require('datejs');

/**
 * Configure App
 */

app.configure(function() {
  app.set('view engine', 'html');
  app.engine('html', require('hbs').__express);
  app.use(express['static']('./public'));
});

if(process.env.CROSS_SITE) {
  app.all('/*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
  });
}

if(process.env.FLUSH_START) {
  cachey.flush(console.log);
}

/**
 * Routes
 */

app.get('/', function(req, res) {
  res.redirect('/package/npm');
});

app.get('/package/:package', function(req, res, next) {
  res.locals['package'] = {name:req.params['package']};
  res.render('package');
});

app.get('/package/:package/30days.json', function(req, res, next) {
  db.get30Days(req.params['package'], function(err, data) {
    if(err) return next(err);
    res.jsonp(data);
  });
});

app.get('/package/:package/7days.json', function(req, res, next) {
  db.get7Days(req.params['package'], function(err, data) {
    if(err) return next(err);
    res.jsonp(data);
  });
});

app.get('/user/:username', function(req, res, next) {
  db.getPackagesByUser(req.params['username'], function(err, data) {
    if(err) return next(err);
    res.jsonp(data);
  });
});

app.get('/~:user', function(req, res, next) {
  res.render('user');
});

app.get('/sitemap.xml', function(req, res, next) {
  db.getPackages(function(err, packages) {
    if(err) return next(err);

    var pre ='<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>http://npmgraph.bensbit.co.uk/';
    var post = '</urlset>';

    res.send(pre + packages.join('</loc></url><url><loc>http://npmgraph.bensbit.co.uk/') + '</loc></url>' + post);
  });
});

app.listen(process.env.PORT || 3000);