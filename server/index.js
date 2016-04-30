// Dashboard
var express = require('express');
var session = require('express-session');
var app = express();

app.use(session({ secret: 'dashboard', cookie: { maxAge: 60000 } }));

// allow all cross-origin requests
app.all('/*', function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	next();
});

app.all('/', function (req, res) {
	res.send('Dashboard API');
});

// return default configuration
app.get('/dashboard/default', function (req, res) {
	res.json(require('./mock_data/default.json'));
});

// return widgets content
app.get('/dashboard/widgets/:id', function (req, res) {
	var id = 'Widget ID: ' + req.params.id + '<br>';
	res.send(id + require('fs').readFileSync('./mock_data/widget.html', 'utf8'));
});

// return widgets settings content
app.get('/dashboard/settings/:id', function (req, res) {
	res.send('Widget ' + req.params.id + ' settings!');
});

// return app content
app.get('/dashboard/app/:id', function (req, res) {
	res.send('App ' + req.params.id + ' content!');
});

// profile check
app.get('/dashboard/profile/check', function (req, res) {
	console.log('check req.session', req.session.login);
	res.json({ login: req.session.login });
});

// profile login
app.post('/dashboard/profile/login', function (req, res) {
	req.session.login = true;
	console.log('login req.session', req.session.login);
	res.json({ login: true });
});

// profile logout
app.post('/dashboard/profile/logout', function (req, res) {
	req.session.login = false;
	console.log('logout req.session', req.session.login);
	res.json({ login: false });
});

app.listen(3333, function () {
	console.log('Dashboard API available on port 3333');
});
