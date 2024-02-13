const Genre = require("../models/genre");
const Book = require("../models/book");

const asyncHandler = require("express-async-handler");
const mongoose = require('mongoose');

const { body, validationResult } = require('express-validator');

// Display list of all Genre.
exports.genre_list = asyncHandler(async (req, res, next) => {
  const allGenres = await Genre.find().sort({name: 1}).exec();

  res.render('genre_list', {
    title: 'Genre List',
    genre_list: allGenres
  })
});

// Display detail page for a specific Genre.
exports.genre_detail = asyncHandler(async (req, res, next) => {

    if(!mongoose.isValidObjectId(req.params.id)){
        const err = new Error("Invalid Genre ID");
        err.status = 400;
        return next(err);
    }

     // Get details of genre and all associated books (in parallel)
    const [genre, booksInGenre] = await Promise.all([
        Genre.findById(req.params.id).exec(),
        Book.find({genre: req.params.id}, "title summary").exec(),
    ]);

    if(genre === null) {
        const err = new Error("Genre not found");
        err.status = 404;
        return next(err);
    }

    res.render('genre_detail', {
        title: "Genre Details",
        genre: genre,
        genre_books: booksInGenre,
    })
});

// Display Genre create form on GET.
exports.genre_create_get = (req, res, next) => {
  res.render('genre_form', { title: 'Create Genre'});
};

// Handle Genre create on POST.
// Note the array of middleware functions that will be called with express
exports.genre_create_post = [
    // First run a validation and sanitization of the name field in the form
    body('name', "Genre name must contain at least 3 characters")
        .trim() // Remove whitespace trailing and ending
        .isLength({ min: 3 }) // Min length of 3
        .escape(), // Remove malicious scripts

    // Then process request
    asyncHandler(async (req, res, next) => {
        //Extract the validation errors (if present) from request
        const errors = validationResult(req);

        //Create a genre object with escaped and trimmed data
        const genre = new Genre({name: req.body.name});

        if(!errors.isEmpty()){
            // There are errors. Render the form again with the sanitized values/error messages.
            res.render('genre_form',{
                title: 'Create Genre',
                genre: genre,
                errors: errors.array()
            })
            return;
        }

        // If fxn gets this far then its because there are no errors
        const genreExists = await Genre.findOne({name: req.body.name})
            .collation({ locale: "en", strength: 2 })
            .exec()
        if (genreExists) {
            //If this is an existing genre, then don't bother creating a new one in database. Redirect
            res.redirect(genreExists.url);
        }
        else {
            // If it doesn't exist, then.. make it.
            await genre.save();
            res.redirect(genre.url)
        }
        
    })
];

// Display Genre delete form on GET.
exports.genre_delete_get = asyncHandler(async (req, res, next) => {

  if(!mongoose.isValidObjectId(req.params.id)){
    const err = new Error("Invalid Genre ID");
    err.status = 400;
    return next(err);
  }

  // Get details of genre and all associated books (in parallel)
  const [genre, booksInGenre] = await Promise.all([
      Genre.findById(req.params.id).exec(),
      Book.find({genre: req.params.id}, "title summary").exec(),
  ]);

  if(genre === null) {
      const err = new Error("Genre not found");
      err.status = 404;
      return next(err);
  }

  res.render('genre_delete', {
      title: "Genre Delete",
      genre: genre,
      genre_books: booksInGenre,
  })

});

// Handle Genre delete on POST.
exports.genre_delete_post = asyncHandler(async (req, res, next) => {
  // Check if book exists and if it has any active instances
  const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({genre: req.params.id}, "title summary").exec(),
  ]);

  if (genre === null) {
    // No results.
    const err = new Error("Genre not found");
    err.status = 404;
    return next(err);
  }

  if (booksInGenre.length > 0) {
    // There are still book instances Render in same way as for GET route.
    res.render('genre_delete', {
      title: "Genre Delete",
      genre: genre,
      genre_books: allBooks,
    })
    return;
  }

  await Genre.findByIdAndDelete(req.params.id).exec();
  res.redirect('/catalog/genres');

});

// Display Genre update form on GET.
exports.genre_update_get = asyncHandler(async (req, res, next) => {
  //Get the current Genre details
  const genre = await Genre.findById(req.params.id).exec();

  //Render the form and pass it the genre info
  res.render('genre_form', { 
    title: 'Update Genre',
    genre: genre
  });

});

// Handle Genre update on POST.
exports.genre_update_post = [
  // First run a validation and sanitization of the name field in the form
  body('name', "Genre name must contain at least 3 characters")
  .trim() // Remove whitespace trailing and ending
  .isLength({ min: 3 }) // Min length of 3
  .escape(), // Remove malicious scripts

  // Then process request
  asyncHandler(async (req, res, next) => {
  //Extract the validation errors (if present) from request
  const errors = validationResult(req);

  const currGenreId = req.params.id;
  const newGenreName = req.body.name;

    if(!errors.isEmpty()){
        // There are errors. Render the form again with the sanitized values/error messages.
        res.render('genre_form',{
            title: 'Update Genre',
            genre: new Genre({name: newGenreName}),
            errors: errors.array()
        })
        return;
    }

    // If fxn gets this far then its because there are no errors
    const genreExists = await Genre.findOne({name: newGenreName})
        .collation({ locale: "en", strength: 2 })
        .exec()
    if (genreExists && genreExists._id.toString() !== currGenreId) {
        //If this is an existing genre, then don't bother creating a new one in database.

        // First, update all the books in the genre to point to the existing Genre entry
        const booksInGenre = await Book.updateMany({genre: currGenreId}, {genre: genreExists._id}).exec();

        //Then delete the current genre
        await Genre.findByIdAndDelete(currGenreId).exec();

        res.redirect(genreExists.url);
    }
    else {
        const currGenre = Genre.findByIdAndUpdate(currGenreId,{name: req.body.name}).exec();
        res.redirect((await Genre.findById(currGenreId).exec()).url)
    }
  })
]