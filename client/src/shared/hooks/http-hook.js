import { useState, useCallback, useRef, useEffect } from "react";

export const useHttpClient = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState();

  //Створюємо посилання на реквести, щоб уникнути ререндерингу, коли вже перейшли на іншу сторінку
  const activeHttpRequests = useRef([]);
  //огортаємо функцію в useCallback щоб уникнути замкнутого виконання коду
  const sendRequest = useCallback(
    async (url, method = "GET", body = null, headers = {}) => {
      setIsLoading(true);

      //створюємо контролера та передаємо в нього дані, якщо ми змінили сторінку для запобігання ререндеру
      const httpAbortCtrl = new AbortController();
      activeHttpRequests.current.push(httpAbortCtrl);

      try {
        const response = await fetch(url, {
          method,
          body,
          headers,
          signal: httpAbortCtrl.signal, // додаємо абортКонтролер до запиту, і тепер ми можемо відміняти запит
        });

        //очкуємо на відповідь у форматі json
        const responseData = await response.json();

        //після отримання респонсу, видаляємо контролер реквесту який був виконаний
        activeHttpRequests.current = activeHttpRequests.current.filter(
          (reqCtrl) => reqCtrl !== httpAbortCtrl
        );

        // якщо ми отримуемо статус код 200 (400 і 500 коди не проходять цю перевірку) тому робимо !ok
        if (!response.ok) {
          throw new Error(responseData.message);
        }

        setIsLoading(false);
        return responseData;
      } catch (err) {
        setError(err.message); // якщо помилка - викидаємо її в стейт
        setIsLoading(false);
        throw err;
      }
    },
    [] //ніколи не буде ререндериться поки знову не запуститься цей хук, так як немає ніяких залежностей
  );

  const clearError = () => {
    setError(null);
  };

  //використовуємо useEffect щоб очистити компонент коли він unmount
  useEffect(() => {
    return () => {
      activeHttpRequests.current.forEach((abortCtrl) => abortCtrl.abort());
    }; // ця функція слугує як очисник до того як юзЕфект не почнеться заново або не буде анмаунт
  }, []);

  return { isLoading, error, sendRequest, clearError };
};
