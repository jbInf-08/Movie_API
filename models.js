const mongoose = require('mongoose');

// Define schema for Movies
const movieSchema = new mongoose.Schema({
    Title: {
        type: String,
        required: true
    },
    Description: {
        type: String,
        required: true
    },
    Genre: {
        Name: String,
        Description: String
    },
    Director: {
        Name: String,
        Bio: String,
        Birth: String,
        Death: String
    },
    ImagePath: String,
    Featured: Boolean
});

// Define schema for Users
const userSchema = new mongoose.Schema({
    Username: {
        type: String,
        required: true
    },
    Password: {
        type: String,
        required: true
    },
    Email: {
        type: String,
        required: true
    },
    Birthday: Date,
    FavoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }]
});

// Create models
const Movie = mongoose.model('Movie', movieSchema);
const User = mongoose.model('User', userSchema);

// Export models
module.exports.Movie = Movie;
module.exports.User = User;