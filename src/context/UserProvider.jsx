import React, { createContext, useContext, useState } from "react";
export const ContextProvider = createContext(undefined);
const UserProvider = ({ children }) => {
  const [appUser, setAppUser] = useState({ userId: "" });

  return (
    <ContextProvider.Provider value={[appUser, setAppUser]}>
      {children}
    </ContextProvider.Provider>
  );
};

export default UserProvider;
