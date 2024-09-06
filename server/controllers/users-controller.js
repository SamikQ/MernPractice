const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const User = require("../models/user");

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password"); // виключаємо пароль з обєктів
  } catch (err) {
    const error = new HttpError(
      "Fetching users failed, please try again later",
      500
    );
    return next(error);
  }
  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req); // передаємо реквест до функції Валідатору, яка перевірить, чи виконані умови, зазначені в роутсах
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Signup failed, please try again later", 500);
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      "user exists already, please login instead",
      422
    );
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    image:
      "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.vulture.com%2Farticle%2Favatar-is-back-in-theaters-and-its-still-great.html&psig=AOvVaw1lFrdpumN8dkDFm4ffBgpk&ust=1725692381768000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCLiSqqDfrYgDFQAAAAAdAAAAABAE",
    password,
    places: [], // на початку масив пустий, так як юзер новий і нічого не додавав.
  });

  try {
    await createdUser.save(); // save функція яка зберігає щось в БД
  } catch (err) {
    const error = new HttpError("Signing up failed, try again", 500);
    return next(error);
  }

  res.status(201).json({ user: createdUser.toObject({ getters: true }) });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Logging in faled, please try again later",
      500
    );
    return next(error);
  }

  if (!existingUser || existingUser.password !== password) {
    const error = new HttpError("Invalid credentials, couldnt log you in");
    return next(error);
  }

  res.json({ message: "loged in!" });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
