const express = require('express');
const app = express();
const http = require('http').Server(app);
const { db } = require('./db');
const passport = require('passport');
const { passportMiddleware } = require('./methods');

const cookieParser = require('cookie-parser');
const session = require('express-session');
const { port } = require('./config');
const { checkOrCreateFolder } = require('./methods');

// initalize sequelize with session store
(async () => {
	await db.loadDB();

	//create uploads folder if it wasn't there
	await checkOrCreateFolder('./uploads/profile/.');
	await checkOrCreateFolder('./uploads/projects/.');

	app
		.use(cookieParser())
		.use(express.json())
		.use(
			session({
				secret: 'iloveparlorandparlorlovesme',
				store: db.myStore,
				resave: true,
				proxy: true,
				saveUninitialized: true
			})
		)
		.use(passport.initialize())
		.use(passport.session())
		.use('/uploads', express.static(__dirname + '/uploads'))
		.use('/uploads', express.static(__dirname + '/statics'))
		.use((req, res, next) => {
			res.header('Access-Control-Allow-Credentials', true);
			res.header('Access-Control-Allow-Origin', req.headers.origin);
			res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
			res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
			next();
		});

	//sync sessions with db
	db.myStore.sync();

	passportMiddleware(passport);

	//initialize routes
	require('./routes')(app, passport);

	// listen to port
	http.listen(port, () => console.log(`Example app listening on port ${port}!`));
})();
