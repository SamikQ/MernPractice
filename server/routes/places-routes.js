const express = require("express");
const { check } = require("express-validator");

const placesControllers = require("../controllers/places-controller");

const router = express.Router(); // створємо роут за допомогою методу Router()

router.get("/:pid", placesControllers.getPlaceById);

router.get("/user/:uid", placesControllers.getPlacesByUserId);

router.post(
  "/",
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ], // додаємо аргумент check(додаємо параметр який хочемо відвалідувати) function яка відпрацює раніше за контроллер, потім обираємо параметр за яким ми хочемо перевірити
  placesControllers.createPlace
);

router.patch(
  "/:pid",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  placesControllers.updatePlaceById
);

router.delete("/:pid", placesControllers.deletePlaceById);

module.exports = router; //експорт файлу
