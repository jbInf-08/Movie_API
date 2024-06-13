const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Models = require('./models.js');
const Movies = Models.Movie;
const Users = Models.User;
const passport = require('passport');
const passportJWT = require('passport-jwt');
const ExtractJWT = passportJWT.ExtractJwt;
const JWTStrategy = passportJWT.Strategy;
const cors = require('cors');
const { authenticateUser } = require('./auth');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');

// Default values
const connectionString = 'mongodb://localhost:27017/myFlixDB';
const jwtSecret = "your_jwt_secret";

// Connect to MongoDB
mongoose.connect(process.env.CONNECTION_URI || connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Failed to connect to MongoDB', err);
});

// Logging
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// CORS configuration
app.use(cors({
    origin: 'https://my-flix-api-faa857fcfb0f.herokuapp.com/',
    optionsSuccessStatus: 200
  }));
  
  let auth = require('./auth')(app);

// Passport middleware
app.use(passport.initialize());
passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: jwtSecret,
}, async (jwtPayload, done) => {
    try {
        const user = await Users.findById(jwtPayload.userId);
        if (!user) {
            return done(null, false, { message: 'User not found' });
        }
        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));

// Root route
app.get('/', (req, res) => {
    res.send('Welcome to MyFlix API');
});

// Route to handle login
app.post('/login', async (req, res) => {
    await authenticateUser(req, res);
});

// Routes and other endpoints

// Route to fetch movies without authentication
app.get('/movies', async (req, res) => {
    await Movies.find()
        .then((movies) => {
            res.status(201).json(movies);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

app.get('/movies/:title', async (req, res) => {
    try {
        const movie = await Movies.findOne({ Title: req.params.title });
        if (movie) {
            res.status(200).json(movie);
        } else {
            res.status(404).send('Movie not found :(');
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get('/genres/:genre', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const movies = await Movies.find({ 'Genre.Name': req.params.genre });
        if (movies.length > 0) {
            const genreData = {
                Name: req.params.genre,
                Description: movies[0].Genre.Description
            };
            res.status(200).json(genreData);
        } else {
            res.status(404).send('Genre not found :(');
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get('/directors/:director', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const movies = await Movies.find({ 'Director.Name': req.params.director });
        if (movies.length > 0) {
            const directorData = {
                Name: req.params.director,
                Bio: movies[0].Director.Bio,
                Birth: movies[0].Director.Birth,
                Death: movies[0].Director.Death
            };
            res.status(200).json(directorData);
        } else {
            res.status(404).send('Director not found :(');
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

app.post('/users', [
    check('Username', 'Username is required').isLength({ min: 5 }),
    check('Password', 'Password is required').isLength({ min: 5 }),
    check('Email', 'Email is not valid').isEmail()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    try {
        const { Username, Password, Email, Birthday } = req.body;

        const existingUser = await Users.findOne({ Username });
        if (existingUser) {
            return res.status(409).json({ message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(Password, 10);

        const newUser = new Users({
            Username,
            Password: hashedPassword,
            Email,
            Birthday
        });

        await newUser.save();
        res.status(201).json({ message: 'User created successfully', user: newUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.put('/users/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const updatedUser = await Users.findByIdAndUpdate(req.params.id, { $set: { Username: req.body.Username } }, { new: true });
        if (updatedUser) {
            res.status(200).json(updatedUser);
        } else {
            res.status(404).send('User not found :(');
        }
    } catch (err) {
        res.status(400).send(err);
    }
});

app.post('/users/:userId/favorites', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const movie = await Movies.findById(req.body.movieId);
        if (movie) {
            await Users.findByIdAndUpdate(req.params.userId, { $push: { FavoriteMovies: req.body.movieId } }, { new: true });
            res.status(200).send("User's favorite movies have been updated");
        } else {
            res.status(404).send('Movie not found :(');
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

app.delete('/users/:userId/favorites/:movieId', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        await Users.findByIdAndUpdate(req.params.userId, { $pull: { FavoriteMovies: req.params.movieId } });
        res.status(200).send('Movie deleted successfully');
    } catch (err) {
        res.status(400).send(err);
    }
});

app.delete('/users/:id/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const deletedUser = await Users.findOneAndDelete({ _id: req.params.id });
        if (deletedUser) {
            res.status(200).send('User has been deleted');
        } else {
            res.status(404).send('User not found :(');
        }
    } catch (err) {
        res.status(400).send(err);
    }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});