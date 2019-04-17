const express = require('express');
const app = express();
const http = require('http').Server(app);
const { db } = require('./db');
const passport = require('passport');
const { passportMiddleware } = require('./methods');
const cors = require('cors');

const cookieParser = require('cookie-parser');
const session = require('express-session');
const { port, client, cookieSetting } = require('./config');
const { checkOrCreateFolder } = require('./methods');
// initalize sequelize with session store
(async () => {
	await db.loadDB();

	//create uploads folder if it wasn't there
	await checkOrCreateFolder('./uploads/profile/.');
	await checkOrCreateFolder('./uploads/projects/.');

	app
		.use(
			cors({
				origin: client,
				credentials: true
			})
		)
		.use(cookieParser())
		.use(express.json())
		.use(
			session({
				secret: 'iloveparlorandparlorlovesme',
				cookie: {
					domain: cookieSetting
				},
				store: db.myStore,
				resave: true,
				proxy: true,
				saveUninitialized: true
			})
		)
		.use(passport.initialize())
		.use(passport.session())
		.use('/uploads', express.static(__dirname + '/uploads'))
		.use('/uploads', express.static(__dirname + '/statics'));

	//sync sessions with db
	db.myStore.sync();

	passportMiddleware(passport);

	//initialize routes
	require('./routes')(app, passport);

	// listen to port
	http.listen(port, () => console.log(`Example app listening on port ${port}!`));
})();
