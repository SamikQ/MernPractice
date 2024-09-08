import React, { useState, useCallback, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Redirect,
  Switch,
} from "react-router-dom";

import Users from "./user/pages/Users";
import NewPlace from "./places/pages/NewPlace";
import UserPlaces from "./places/pages/UserPlaces";
import UpdatePlace from "./places/pages/UpdatePlace";
import Auth from "./user/pages/Auth";
import MainNavigation from "./shared/components/Navigation/MainNavigation";
import { AuthContext } from "./shared/context/auth-context";

//таймер  логіну не повинен бути в рендерингу
let logutTimer;

const App = () => {
  const [token, setToken] = useState(false);
  const [tokenExpirationDate, setTokenExpirationDate] = useState();
  const [userId, setUserId] = useState(false);

  // useCallback виступає як проміс і не перезапускає useEffect кожен раз
  const login = useCallback((uid, token, expirationDate) => {
    setToken(token);
    setUserId(uid);

    //визначаємо термін дії токену       ча         і додаємо одну годину
    const tokenDate =
      expirationDate || new Date(new Date().getTime() + 1000 * 60 * 60); // якщо немає терміну придатності, створюємо новий
    setTokenExpirationDate(tokenDate);
    //зберігаємо сессію, щоб при перезавантаженні логін не зникав (setItem зберігає в локал сторедж строку)
    localStorage.setItem(
      "userData",
      //JSON стрінгіфай конвертує JS код в строку
      JSON.stringify({
        userId: uid,
        token: token,
        expiration: tokenDate.toISOString(), // конвертуємо дату за допомогою toISOString()
      })
    );
    setUserId(uid);
  }, []);

  // за допомогою колбеку ця вінця ніколи не буде перестворена і в нас не буде замкнутого циклу
  const logout = useCallback(() => {
    setToken(null);
    setTokenExpirationDate(null);
    setUserId(null);
    // чистимо локал сторедж після логауту
    localStorage.removeItem("userData");
  }, []);

  //контроль таймінгу сесії
  useEffect(() => {
    //перевіряжмо чи валідний токен
    if (token && tokenExpirationDate) {
      // визначаємо час, який залишився для дії токену
      const remainingTime =
        tokenExpirationDate.getTime() - new Date().getTime();

      logutTimer = setTimeout(logout, remainingTime); // викликаємо функцію логуаут коли закінчиться час
    } else {
      clearTimeout(logutTimer);
    }
  }, [token, logout, tokenExpirationDate]);

  //Autologin
  //перевірка, чи юзер залогінений, перевіряючи локалСторедж (відпрацює один раз, коли компонент завантажений)
  useEffect(() => {
    // JSON.parse конвертує сторку назад в JS код
    const storedData = JSON.parse(localStorage.getItem("userData")); // getItem() бере з локалстореджу дані
    // якщо юзер логінився, ми передаємо дані з локалСторедж в функцію логін.
    if (
      storedData &&
      storedData.token &&
      new Date(storedData.expiration) > new Date()
    ) {
      login(
        storedData.userId,
        storedData.token,
        new Date(storedData.expiration)
      );
    }
  }, [login]);

  let routes;

  if (token) {
    routes = (
      <Switch>
        <Route path="/" exact>
          <Users />
        </Route>
        <Route path="/:userId/places" exact>
          <UserPlaces />
        </Route>
        <Route path="/places/new" exact>
          <NewPlace />
        </Route>
        <Route path="/places/:placeId">
          <UpdatePlace />
        </Route>
        <Redirect to="/" />
      </Switch>
    );
  } else {
    routes = (
      <Switch>
        <Route path="/" exact>
          <Users />
        </Route>
        <Route path="/:userId/places" exact>
          <UserPlaces />
        </Route>
        <Route path="/auth">
          <Auth />
        </Route>
        <Redirect to="/auth" />
      </Switch>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: !!token,
        token: token,
        userId: userId,
        login: login,
        logout: logout,
      }}>
      <Router>
        <MainNavigation />
        <main>{routes}</main>
      </Router>
    </AuthContext.Provider>
  );
};

export default App;
