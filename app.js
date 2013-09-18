
/**
 * Module dependencies.
 */
var fs = require('fs');
var accessLogFile = fs.createWriteStream('access.log', {flags:'a'});
var errorLogFile = fs.createWriteStream('error.log', {flags:'a'});


var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var engine = require('ejs-locals');
var MongoStore = require("connect-mongo")(express);
var settings = require("./settings");
var flash = require("connect-flash");
var partials = require("express-partials");
var app = express();
module.exports = app;
// all environments

app.engine('ejs', engine);
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
//app.use(express.logger('dev'));
app.use(express.logger({stream:accessLogFile}));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(partials());
app.use(flash());
app.use(express.session({
	secret: settings.cookieSecret,
	store: new MongoStore({
		db: settings.db
	})
}));

app.use(function(req, res, next) {
	var err = req.flash('error');
	var success = req.flash('success');
	res.locals.user = req.session ? req.session.user : null;
	res.locals.error = err.length ? err : null;
	res.locals.success = success.length ? success : null;
	next();
});
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
routes(app);


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.configure('production', function() {
	app.use(function(err, req, res, next) {
		var meta = '[' + new Date() + ']' + req.url + '\n';
		errorLogFile.write(meta + err.stack + '\n');
		next();
	});
});

var server = http.createServer(app);
if(!module.parent) {
	server.listen(app.get('port'));
	console.log("Express server listening on port %d", app.get('port'));
}


/*http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});*/
