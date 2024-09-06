import React, { useEffect, useState } from "react";

import UsersList from "../components/UsersList";
import ErrorModal from "../../shared/components/UIElements/ErrorModal";
import LoadingSpinner from "../../shared/components/UIElements/LoadingSpinner";
import { useHttpClient } from "../../shared/hooks/http-hook";

const Users = () => {
  const [loadedUsers, setLoadedUsers] = useState();

  const { isLoading, error, sendRequest, clearError } = useHttpClient();

  useEffect(() => {
    // useEffect не може бути асинхронним
    const fetchUsers = async () => {
      try {
        const response = await sendRequest("http://localhost:5000/api/users");

        setLoadedUsers(response.users);
      } catch (err) {}
    };
    fetchUsers();
  }, [sendRequest]); //якщо масив пустий, useEffect відпрацює лише один раз || після кастом хуку, в якому ми використали useCallback, ми слідкуємо за sendRequest

  const errorHandler = () => {
    clearError();
  };

  return (
    <>
      <ErrorModal error={error} onClear={errorHandler} />
      {isLoading && (
        <div className="center">
          <LoadingSpinner />
        </div>
      )}
      {!isLoading && loadedUsers && <UsersList items={loadedUsers} />}
    </>
  );
};

export default Users;
