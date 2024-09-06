const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true }, // unique - дозволяє швидше знайти емейл в нашій БД
  password: { type: String, required: true, minlength: 6 },
  image: { type: String, required: true },
  places: [{ type: mongoose.Types.ObjectId, required: true, ref: "Place" }], //зазначаємо реф на плейсес і вказуємо що це массив за допомогою []
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
