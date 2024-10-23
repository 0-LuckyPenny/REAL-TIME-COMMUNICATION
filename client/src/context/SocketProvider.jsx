import React, { createContext } from "react";
import { useContext } from "react";
import { useMemo } from "react";
import io from "socket.io-client";

// context create
const SocketContext = createContext(null);

export const useSocket = () => {
  const socket = useContext(SocketContext);
  return socket;
};

// Provider function to provide socketContext value to children
export const SocketProvider = ({ children }) => {
  const socket = useMemo(() => io("localhost:8000"), []);
  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
