
/**
 * Dependencies
 */

var express =require('express'),
    app = express(),
    request = require('request'),
    redis = require('redis-url').connect(process.env.REDISTOGO_URL),
    cachey = require('cachey')({redisClient:redis}),
    db = new (require('./lib/db'))(cachey, 60 * 60),
    browserify = require('browserify-middleware');

require('datejs');

/**
 * Configure App
 */

browserify.settings.production('cache', '20 mins');
browserify.settings.mode = process.env.NODE_ENV || 'development';

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

app.configure(function() {
  app.set('view engine', 'html');
  app.engine('html', require('hbs').__express);
  app.use(express['static']('./public'));
});

app.configure('development', function() {
  app.use(express.logger('dev'));
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
  res.render('search', { pageType: 'search', noContainer: true });
});

app.get('/package/:package', function(req, res, next) {
  res.locals['package'] = {name:req.params['package']};
  res.locals.pageType = 'package';
  res.locals.pagePackage = req.params['package'];
  res.render('package');
});

app.get('/~:user', function(req, res, next) {
  res.render('user', {user:req.params.user, pageType: 'user', pageUser: req.params.user});
});

app.get('/user/:user', function(req, res, next) {
  res.redirect('/~' + req.params.user);
});


/**
 * Data Routes
 */

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

app.get('/user/:username/packages.json', function(req, res, next) {
  db.getPackagesByUser(req.params['username'], function(err, data) {
    if(err) return next(err);
    res.jsonp(data);
  });
});

app.get('/bundle.js', browserify('./client/index.js'));

app.get('/sitemap.xml', function(req, res, next) {
  db.getPackages(function(err, packages) {
    if(err) return next(err);

    var pre ='<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>http://npmgraph.bensbit.co.uk/';
    var post = '</urlset>';

    res.send(pre + packages.join('</loc></url><url><loc>http://npmgraph.bensbit.co.uk/') + '</loc></url>' + post);
  });
});

app.listen(process.env.PORT || 3000);