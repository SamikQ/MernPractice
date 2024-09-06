const express = require("express");
const { check } = require("express-validator");

const usersController = require("../controllers/users-controller");

const router = express.Router();

router.get("/", usersController.getUsers);

router.post(
  "/signup",
  [
    check("name").not().isEmpty(), 
    check("email").normalizeEmail() // нормалізуємо email,
    .isEmail(), // перевіряємо, чи цей email валідний
    check('password').isLength({min: 6})// перевіряємо довжину пароля, в цілях безпеки
],
  usersController.signup
);

router.post("/login", usersController.login);

module.exports = router;
