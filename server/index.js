// Dashboard
var
	express = require('express'),
	session = require('express-session'),
	app = express();

app.use(express.static(__dirname + '/../client'));
app.use(session({ secret: '*', resave: true, saveUninitialized: true }));

// return default configuration
app.get('/dashboard/default', function (req, res) {
	res.json(require('./mock_data/default.json'));
});

// return widgets content
app.get('/dashboard/widgets/:id', function (req, res) {
	var id = 'Widget ID: ' + req.params.id + '<br>';
	res.send(id + require('fs').readFileSync('./mock_data/widget.html', 'utf8'));
});

// return settings content
app.get('/dashboard/settings/:id', function (req, res) {
	res.send('Widget ' + req.params.id + ' settings!');
});

// return app content
app.get('/dashboard/app/:id', function (req, res) {
	res.send('App ' + req.params.id + ' content!');
});

// profile check
app.get('/dashboard/profile/check', function (req, res) {
	res.json({ login: req.session.login });
});

// login
app.post('/dashboard/profile/login', function (req, res) {
	req.session.login = true;
	res.json({ login: true });
});

// logout
app.post('/dashboard/profile/logout', function (req, res) {
	req.session.login = false;
	res.json({ login: false });
});

app.listen(3333, function () {
	console.log('\nDashboard Server\n');
});
