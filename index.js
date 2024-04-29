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

mongoose.connect('mongodb://localhost:27017/movie_api', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Welcome to my movie API!');
});

// Return a list of ALL movies
app.get('/movies', (req, res) => {
  Movies.find()
    .then(movies => res.status(200).json(movies))
    .catch(err => res.status(500).send(err));
});

// Return data about a single movie by title
app.get('/movies/:title', (req, res) => {
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
app.get('/genres/:genre', (req, res) => {
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
app.get('/directors/:director', (req, res) => {
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

// Allow new users to register
app.post('/users', (req, res) => {
  const newUser = new Users(req.body);
  newUser.save()
    .then(user => res.status(201).json(user))
    .catch(err => res.status(400).send(err));
});

// Allow users to update their user info (username)
app.put('/users/:id', (req, res) => {
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
app.post('/users/:userId/favorites', (req, res) => {
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
app.delete('/users/:userId/favorites/:movieId', (req, res) => {
  const { userId, movieId } = req.params;
  Users.findByIdAndUpdate(userId, { $pull: { FavoriteMovies: movieId } })
    .then(() => res.status(200).send('Movie deleted successfully'))
    .catch(err => res.status(400).send(err));
});

// Delete a user
app.delete('/users/:id/', (req, res) => {
    const { id } = req.params;
    Users.findOneAndDelete({ _id: id })
        .then(() => res.status(200).send('User has been deleted'))
        .catch(err => res.status(400).send(err));
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});