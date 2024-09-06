const { v4: uuidv4 } = require("uuid"); // бібліотечка для генерації унікального ІД
const { validationResult } = require("express-validator"); // додаємо метод Валідейшн резалт який працює в парі з Валідатором в places-routes;

const HttpError = require("../models/http-error");
const getCoordsForAddress = require("../util/location");

const Place = require("../models/place");
const User = require("../models/user");
const { mongoose } = require("mongoose");
const user = require("../models/user");

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid; // { pid: p1} <--- так відпрацьовує метод експресу params на req

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError("something went wrong!", 500);
    return next(error); // не забуваємо преривати код, якщо пішла помилка
  }

  if (!place) {
    const error = new HttpError("Could not find a place for provided ID!"); // throw --- тригерить ерор хендлер мідлвейр який ми створили в апп з 4 параметрами
    return next(error);
    // next(error);  <---- обовязково використовувати next(), якщо працюємо з БД та асинхронним кодом
  }

  res.json({ place: place.toObject({ getters: true }) }); // toObject - перетворюємо респонс в нормальний JS код. getters:true - прибирає нижне підчеркнення в ід (специфіка Мангуса)
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid; // { pid: p1} <--- так відпрацьовує метод експресу params на req

  // Альтернативний метод за допомогою методу populate();

  let userWithPlaces;

  try {
    places = await Place.findById(userId).populate("places"); // отримуємо доступ до плейсес в юзерІд за допомогою методу populate
  } catch (err) {
    const error = new HttpError("something went wrong!", 500);
    return next(error);
  }

  // let places;

  // try {
  //   places = await Place.find({ creator: userId });
  // } catch (err) {
  //   const error = new HttpError("something went wrong!", 500);
  //   return next(error);
  // }

  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    return next(new HttpError("Could not find  places for provided ID!"), 404); // next не прериває подальше виконання коду, тому треба return
  }

  res.json({
    places: userWithPlaces.map((place) => place.toObject({ getters: true })), // при методі find приходить массив. Тому необхідно його перебрати і переробити в обьекти
  });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req); // передаємо реквест до функції Валідатору, яка перевірить, чи виконані умови, зазначені в роутсах
  if (!errors.isEmpty()) {
    //next() ОБОВЯЗКОВЕ ВИКОРИСТАННЯ ЗАМІСТЬ THROW який не буде працювати корректно, Так як працюємо з асинхронним кодом
    next(new HttpError("Invalid inputs passed, please check your data.", 422));
  }

  const { title, description, address, creator } = req.body; //визначаємо необхідні елементи з тіла запиту

  let coordinates;
  // getCoordsForAddress може видати помилку, тому нам треба робити це через try catch
  try {
    coordinates = getCoordsForAddress(address);
  } catch (error) {
    return next(error); // Прериваємо код і перенаправляємо помилку далі в нашу спеціальну функцію
  }

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: "https://treeplantation.com/images/articles/banana-tree.png",
    creator,
  });

  let user;

  try {
    user = await User.findById(creator); // перевірка, чи існує користувач щоб додати плейс
  } catch (err) {
    const error = new HttpError("User wasn't found, try again", 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Couldnt find user for provided id", 404);
    return next(error);
  }

  console.log(user);

  try {
    const session = await mongoose.startSession(); // для проведеня транзакцій треба запустити сесію
    session.startTransaction(); //  запускаємо транзакцію в сесії
    await createdPlace.save({ session: session }); // зберігаємо створене місце і отримуємо унікальний ід

    user.places.push(createdPlace); //push() ---- Метод Мангуса! додаємо місце до нашого масиву плейсів в юзера.
    await user.save({ session: session }); // додаємо зміни юзеру який відповідає поточній сессії
    await session.commitTransaction(); // тільки на цьому єтапі зміни реально передадуться в базу даних
  } catch (err) {
    const error = new HttpError("Creating place failed, try again", 500);
    return next(error);
  }
  res.status(201).json({ place: createdPlace }); // код 201 - за конвецією, якщо ми щось додаємо
};

const updatePlaceById = async (req, res, next) => {
  const errors = validationResult(req); // передаємо реквест до функції Валідатору, яка перевірить, чи виконані умови, зазначені в роутсах
  if (!errors.isEmpty()) {
    throw new HttpError("Invalid inputs passed, please check your data.", 422);
  }
  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError("something went wrong", 500);
    return next(error);
  }

  // оновлюємо параметри, які хочемо оновити
  place.title = title;
  place.description = description;

  try {
    await place.save(); // зберігаємо оновлений обєкт (плейс)
  } catch (err) {
    const error = new HttpError("something went wrong", 500);
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) }); // повертаємо респонс (200, так як ми нічого нового не створювали)
};

const deletePlaceById = async (req, res, next) => {
  //варіант видалення елементу з масиву по уроку: (можна видаляти лише зі змінної let)
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate("creator"); // дозволяє знайти, чи розміщений цей документ в інших колекціях і працювати з ним. Обовязково повинна бути залежність через моделі
  } catch (err) {
    const error = new HttpError("coulnd find place by ID", 500);
    return next(error);
  }

  if (!place) {
    const error = new HttpError("Could not find place for this id.", 404);
    return next(error);
  }

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await place.deleteOne({ session: session });

    await place.creator.places.pull(place); // pull автоматично видаляє id від користувача
    await place.creator.save({ session: session }); // додаємо зміни юзеру який відповідає поточній сессії
    await session.commitTransaction();
  } catch (err) {
    const error = new HttpError("Coulnd remove the place", 500);
    return next(error);
  }

  // мій варіант видалення елементу з массиву (можна видаляти зі змінної const)
  // const placeId = req.params.pid;
  // const placeIndex = DUMMY_PLACES.findIndex(item => item.id !== placeId);
  // DUMMY_PLACES.splice(placeIndex, 1);

  res.status(200).json({ message: "Succesfully removed" });
};

exports.getPlaceById = getPlaceById; // якщо поставити дужки в кінці, до функція буде викликана!
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlaceById = updatePlaceById;
exports.deletePlaceById = deletePlaceById;
