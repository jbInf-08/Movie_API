const express = require('express');
const app = express();
const fs = require('fs'); 
const path = require('path');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const uuid = require('uuid');

const top10Movies = [
    { title: 'The Shawshank Redemption', year: 1994, rating: 9.3 },
    { title: 'The Godfather', year: 1972, rating: 9.2 },
    { title: 'The Godfather: Part II', year: 1974, rating: 9.0 },
    { title: 'The Dark Knight', year: 2008, rating: 9.0 },
    { title: '12 Angry Men', year: 1957, rating: 8.9 },
    { title: "Schindler's List", year: 1993, rating: 8.9 },
    { title: 'The Lord of the Rings: The Return of the King', year: 2003, rating: 8.9 },
    { title: 'Pulp Fiction', year: 1994, rating: 8.9 },
    { title: 'The Lord of the Rings: The Fellowship of the Ring', year: 2001, rating: 8.8 },
    { title: 'Fight Club', year: 1999, rating: 8.8 }
];

// Create a write stream (in append mode) for logging
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' });

// Set up middleware for logging
app.use(morgan('combined', { stream: accessLogStream }));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Array to store user data
let users = [
    {
        id: '1',
        fullname: 'John Doe',
        email: 'johndoe@mail.com',
        favMovies: [{
        }]
    },
    {
        id: '2',
        fullname: 'Jane Doe',
        email: 'janedoe@mail.com',
        favMovies: [{
        }]
    }
];

// Array to store movie data
const movies = [
  {
      title: 'The Shawshank Redemption',
      description: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
      genre: 'Drama',
      director: 'Frank Darabont',
      imageUrl: 'https://imageurl.com/shawshank_redemption'
  },
  {
      title: 'The Godfather',
      description: 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.',
      genre: 'Crime',
      director: 'Francis Ford Coppola',
      imageUrl: 'https://imageurl.com/the_godfather'
  },
  {
      title: 'The Dark Knight',
      description: 'When the menace known as The Joker emerges from his mysterious past, he wreaks havoc and chaos on the people of Gotham.',
      genre: 'Action',
      director: 'Christopher Nolan',
      imageUrl: 'https://imageurl.com/the_dark_knight'
  },
  {
      title: 'Inception',
      description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
      genre: 'Sci-Fi',
      director: 'Christopher Nolan',
      imageUrl: 'https://imageurl.com/inception'
  },
  {
      title: 'Pulp Fiction',
      description: 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.',
      genre: 'Crime',
      director: 'Quentin Tarantino',
      imageUrl: 'https://imageurl.com/pulp_fiction'
  },
  {
      title: 'The Lord of the Rings: The Fellowship of the Ring',
      description: 'A meek Hobbit from the Shire and eight companions set out on a journey to destroy the powerful One Ring and save Middle-earth from the Dark Lord Sauron.',
      genre: 'Fantasy',
      director: 'Peter Jackson',
      imageUrl: 'https://imageurl.com/lotr_fellowship'
  }
];

// Root route
app.get('/', (req, res) => {
    res.send('Welcome to my movie API!');
});

// READ route for movies
app.get('/movies', (req, res) => {
    res.status(200).json(movies);
});

// READ by title
app.get('/movies/:title', (req, res) => {
    const { title } = req.params;
    const movie = movies.find(movie => movie.title === title);

    if (movie) {
        res.status(200).json(movie);
    } else {
        res.status(404).send('Movie not found :(');
    }
});

// READ Genre by title
app.get('/movies/:title/genre', (req, res) => {
    const { title } = req.params;
    const movie = movies.find(movie => movie.title === title);

    if (movie) {
        res.status(200).json(movie.genre);
    } else {
        res.status(404).send('Movie not found :(');
    }
});

// READ Director by title
app.get('/movies/:title/director', (req, res) => {
    const { title } = req.params;
    const movie = movies.find(movie => movie.title === title);

    if (movie) {
        res.status(200).json(movie.director);
    } else {
        res.status(404).send('Movie not found :(');
    }
});

// Create new user
app.post('/users', (req, res) => {
    const newUser = req.body;
    if (newUser.fullname) {
        newUser.id = uuid.v4();
        users.push(newUser);
        res.status(201).json(newUser);
    } else {
        res.status(400).send('user needs name');
    }
});

// Update username
app.put('/users/:id', (req, res) => {
    const { id } = req.params;
    const updatedUser = req.body;

    let user = users.find(user => user.id == id);

    if (user) {
        user.fullname = updatedUser.fullname;
        res.status(200).json(user);
    } else {
        res.status(400).send('not a registered user');
    }
});

// Update user's favorite movie
app.post('/users/:id/:title', (req, res) => {
    const { id, title } = req.params;

    let user = users.find(user => user.id == id);
    let newTitle = {
        title,
        director: req.body.director,
        genre: req.body.genre
    };

    if (user) {
        user.favMovies.push(newTitle);
        res.status(200).send('user\'s favorite movies have been updated');
    } else {
        res.status(400).send('could not update favorite movies');
    }
});

// Delete a favorite movie
app.delete('/users/:id/:title', (req, res) => {
    const { id, title } = req.params;
    let user = users.find(user => user.id == id);

    if (user) {
        user.favMovies = user.favMovies.filter(m => m.title !== title);
        res.status(200).send('Movie deleted successfully');
    } else {
        res.status(400).send('could not update favorite movies');
    }
});

// Delete a user
app.delete('/users/:id/', (req, res) => {
    const { id } = req.params;
    let user = users.find(user => user.id == id);

    if (user) {
        users = users.filter(user => user.id !== id);
        res.status(200).send('user has been deleted');
    } else {
        res.status(400).send('could not update user');
    }
});

// Server
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});