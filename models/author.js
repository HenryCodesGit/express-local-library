const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { DateTime } = require('luxon');

const AuthorSchema = new Schema({
    first_name: {
        type: String,
        required: true,
        minLength: 1,
        maxLength: 100,
    },
    family_name: {
        type: String,
        required: true,
        minLength: 1,
        maxLength: 100,
    },
    date_of_birth: { type: Date },
    date_of_death: { type: Date },
})

//Virtual for getting the author's full name
AuthorSchema.virtual("name").get(function() {
    let fullname = "";
    if (this.first_name && this.family_name) {
      fullname = `${this.family_name}, ${this.first_name}`;
    }

    return fullname;
})

AuthorSchema.virtual('date_of_birth_formatted').get(function() {
    return this.date_of_birth ? DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_SHORT) : '?';
})

AuthorSchema.virtual('date_of_death_formatted').get(function() {
    return this.date_of_death ?  DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_SHORT) : '?';
})

AuthorSchema.virtual('lifespan').get(function() {
    return (this.date_of_birth && this.date_of_death) ? `${new Date(this.date_of_death).getUTCFullYear() - new Date(this.date_of_birth).getUTCFullYear()} years` : 'Lifespan data not available';
})

//Virtual for the author's URL on the webpage
'catalog/author/this_id'

AuthorSchema.virtual("url").get(function() {
    return `/catalog/author/${this._id}`;
})

module.exports = mongoose.model("Author", AuthorSchema);