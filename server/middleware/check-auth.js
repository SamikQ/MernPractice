//мідлвер який відпрацьовує не аутентифікацію та захист запитів
const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");

module.exports = (req, res, next) => {
  try {
    // за допомогою split("") розбиваємо ключ і значення: Authorization: 'Bearer TOKEN'([1])
    const token = req.headers.authorization.split("")[1]; // використовуємо хедер, щоб отримати дані
    //if відслідковує, чи є взагалі токен
    if (!token) {
      throw new Error("Authentication failed");
    }
    //перевірити валідність токену можна тільки за допомогою суперсекретної строки. Вона мусить бути однакова
    const decodedToken = jwt.verify(token, "supersecret_dont_share");
    req.userData = { userId: decodedToken.userId }; // додаємо до запиту інформацію
    //після декодингу токену, ми отримуємо інформацію яку в нього заклали. В нашому випадку це userId Та userEmail
    next();
    //catch відпрацьовує, якщо в нас немає такого токена, який був отриманий
  } catch (err) {
    const error = new HttpError("Authentication failed", 401);
    return next(error);
  }
};
