const express = require('express');
const app = express();
const http = require('http').Server(app);
const { db, models } = require('./db');
const { User } = models;
const passport = require('passport');
const cookieParser = require('cookie-parser');
const session = require('express-session');

// initalize sequelize with session store
(async () => {
	await db.loadDB();

	//config
	const { port } = require('./config');

	app
		.use(cookieParser())
		.use(express.json())
		.use(
			session({
				secret: 'iloveparlorandparlorlovesme',
				store: db.myStore,
				resave: false,
				proxy: true
			})
		)
		.use(passport.initialize())
		.use(passport.session())
		.use('/uploads', express.static(__dirname + '/uploads'));

	//sync sessions with db
	db.myStore.sync();

	require('./middleware/passport')(passport, User);

	//initialize routes
	require('./routes')(app, passport);

	// listen to port
	http.listen(port, () => console.log(`Example app listening on port ${port}!`));
})();
