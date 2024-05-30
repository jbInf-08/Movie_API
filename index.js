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
const cors = require('cors'); // Import the cors middleware
const { authenticateUser } = require('./auth'); // Import authenticateUser function
const { check, validationResult } = require('express-validator');

// mongoose.connect('mongodb://localhost:27017/myFlixDB', {
    // useNewUrlParser: true,
    // useUnifiedTopology: true
// });

mongoose.connect(process.env.CONNECTION_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Set JWT secret key directly
const jwtSecret = "your_jwt_secret";

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Add this line to parse JSON request bodies

// Configure CORS middleware
const allowedOrigins = ['http://localhost:8080', 'http://your-frontend-origin.com'];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`Origin ${origin} is not allowed`));
        }
    },
    credentials: true
}));

// Passport middleware for JWT authentication
app.use(passport.initialize());

// Passport JWT authentication strategy
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

// Add a new route for handling the /login endpoint
app.post('/login', async (req, res) => {
  await authenticateUser(req, res);
});

// Routes and other endpoints go here...

// Return a list of ALL movies
app.get('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.find()
        .then(movies => res.status(200).json(movies))
        .catch(err => res.status(500).send(err));
});

// Return data about a single movie by title
app.get('/movies/:title', passport.authenticate('jwt', { session: false }), (req, res) => {
    const { title } = req.params;
    Movies.findOne({ Title: title })
        .then(movie => {
            if (movie) {
                res.status(200).json(movie);
            } else {
                res.status(404).send('Movie not found :(');
            }
        })
        .catch(err => res.status(500).send(err));
});

// Return data about a genre by name
app.get('/genres/:genre', passport.authenticate('jwt', { session: false }), (req, res) => {
    const { genre } = req.params;
    Movies.find({ 'Genre.Name': genre })
        .then(movies => {
            if (movies.length > 0) {
                const genreData = {
                    Name: genre,
                    Description: movies[0].Genre.Description
                };
                res.status(200).json(genreData);
            } else {
                res.status(404).send('Genre not found :(');
            }
        })
        .catch(err => res.status(500).send(err));
});

// Return data about a director by name
app.get('/directors/:director', passport.authenticate('jwt', { session: false }), (req, res) => {
    const { director } = req.params;
    Movies.find({ 'Director.Name': director })
        .then(movies => {
            if (movies.length > 0) {
                const directorData = {
                    Name: director,
                    Bio: movies[0].Director.Bio,
                    Birth: movies[0].Director.Birth,
                    Death: movies[0].Director.Death
                };
                res.status(200).json(directorData);
            } else {
                res.status(404).send('Director not found :(');
            }
        })
        .catch(err => res.status(500).send(err));
});

// Allow new users to register (no authentication required)
app.post('/users', async (req, res) => {
    try {
        const { Username, Password, Email, Birthday } = req.body;

        // Check if the user already exists
        const existingUser = await Users.findOne({ Username });
        if (existingUser) {
            return res.status(409).json({ message: 'Username already exists' });
        }

        const hashedPassword = Users.hashPassword(Password);

        // Create a new user
        const newUser = new Users({
            Username: req.body.Username,
            Password: hashedPassword,
            Email: req.body.Email,
            Birthday: req.body.Birthday
        });

        await newUser.save();
        const foundUser = await Users.findOne({ Username: newUser.Username });
        console.log(foundUser);

        res.status(201).json({ message: 'User created successfully', user: newUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Allow users to update their user info (username)
app.put('/users/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
    const { id } = req.params;
    Users.findByIdAndUpdate(id, { $set: { Username: req.body.Username } }, { new: true })
        .then(user => {
            if (user) {
                res.status(200).json(user);
            } else {
                res.status(404).send('User not found :(');
            }
        })
        .catch(err => res.status(400).send(err));
});

// Allow users to add a movie to their list of favorites
app.post('/users/:userId/favorites', passport.authenticate('jwt', { session: false }), (req, res) => {
    const { userId } = req.params;
    const { movieId } = req.body;
    Movies.findById(movieId)
        .then(movie => {
            if (movie) {
                Users.findByIdAndUpdate(userId, { $push: { FavoriteMovies: movie } }, { new: true })
                    .then(user => {
                        res.status(200).send('User\'s favorite movies have been updated');
                    })
                    .catch(err => res.status(400).send(err));
            } else {
                res.status(404).send('Movie not found :(');
            }
        })
        .catch(err => res.status(500).send(err));
});

// Allow users to remove a movie from their list of favorites
app.delete('/users/:userId/favorites/:movieId', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { userId, movieId } = req.params;
  Users.findByIdAndUpdate(userId, { $pull: { FavoriteMovies: movieId } })
      .then(() => res.status(200).send('Movie deleted successfully'))
      .catch(err => res.status(400).send(err));
});

// Delete a user
app.delete('/users/:id/', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { id } = req.params;
  Users.findOneAndDelete({ _id: id })
      .then(() => res.status(200).send('User has been deleted'))
      .catch(err => res.status(400).send(err));
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});