// src/context/UserContext.js
import React, { createContext, useContext } from "react";
import { useUser } from "../hooks/useUser"; // import your custom useUser hook

// Create the context object
const UserContext = createContext();

// Provider component
export function UserProvider({ children }) {
  const userState = useUser(); // Runs useUser hook once for the entire app
  return (
    <UserContext.Provider value={userState}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook for easy consumption in components
export function useUserContext() {
  return useContext(UserContext);
}
