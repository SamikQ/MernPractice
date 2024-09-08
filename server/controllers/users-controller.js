const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs"); // імпортуємо бібліотеку для хешування паролів
const jwt = require("jsonwebtoken");

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

  //хешуємо пароль за допомогою bcryptJS
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12); // передаємо пароль та задаємо рівень хешування
  } catch (err) {
    const error = new HttpError("Could not create user, please try again", 500);
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    image:
      "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.vulture.com%2Farticle%2Favatar-is-back-in-theaters-and-its-still-great.html&psig=AOvVaw1lFrdpumN8dkDFm4ffBgpk&ust=1725692381768000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCLiSqqDfrYgDFQAAAAAdAAAAABAE",
    password: hashedPassword,
    places: [], // на початку масив пустий, так як юзер новий і нічого не додавав.
  });

  try {
    await createdUser.save(); // save функція яка зберігає щось в БД
  } catch (err) {
    const error = new HttpError("Signing up failed, try again", 500);
    return next(error);
  }

  //створюємо вебтокен (верифікація що це дійсно юзер, що токен не підробний)
  let token;
  try {
    // зазначаэмо юзера по ІД, якому буде належати цей токен
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email }, // параметри токену, які будуть в ньому зашиті
      "supersecret_dont_share", // назва токену, яка не передаеться з сервера (приватний ключ)
      { expiresIn: "1h" } // нашатування токену (поставли термін - 1 година)!! обовязково
    ); // метод sign повертає строку - це і є токен
  } catch (err) {
    const error = new HttpError("Signing up failed, try again", 500);
    return next(error);
  }

  //повертаємо дані, які необхідно на фронт-енд
  res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token: token });
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

  if (!existingUser) {
    const error = new HttpError("Invalid credentials, check existing user", 401);
    return next(error);
  }

  //перевірка захешованого паролю
  let isValidPassword = false;

  try {
    // звіряємо захешований пароль за допомогою bcrypt (пароль який прийшов, пароль в БД у юзера)
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError("Wrong password, please try again", 500);
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError("Invalid credentials, check password", 401);
    return next(error);
  }

  //генеруємо  токен
  let token;
  try {
    token = jwt.sign(
      {
        userId: existingUser.id,
        email: existingUser.email,
      },
      "supersecret_dont_share", // secretKey повинен бути такий самий як і при signUp
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError("Logging failed, please try again", 500);
  }

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token, // обовязково повертаємо токен, якийми згенерували
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
