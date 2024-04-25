// Require express in your “index.js” file.
const express = require('express');
const morgan = require('morgan');
const path = require('path');

// Create an Express application
const app = express();

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

// Express static function
app.use(express.static(path.join(__dirname, 'public')));

// Use the Morgan middleware library to log all requests.
app.use(morgan('common'));

// Create another GET route located at the endpoint “/” that returns a default textual response.
app.get('/', (req, res) => {
  res.send('Welcome to my app!');
});

// Create an Express GET route for "/movies".
app.get('/movies', (req, res) => {
  // Return the top 10 movies as JSON
  res.json({ movies: top10Movies });
});


// Use express.static to serve your “documentation.html” file from the public folder.
app.get('/documentation', (req, res) => {                  
  res.sendFile('documentation.html', { root: path.join(__dirname, 'public') });
});



// Create an error-handling middleware function.
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start the server
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Your app is listening on port ${port}.`);
});