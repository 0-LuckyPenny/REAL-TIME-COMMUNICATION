import React, { useEffect, useCallback, useState} from "react";
import { useSocket } from "../context/SocketProvider";
import { useNavigate } from "react-router-dom";

const LobbyScreen = () => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");
  const navigate = useNavigate();
  const socket = useSocket();

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      socket.emit("room:join", { email, room });
    },
    [email, room, socket]
  );

  const handleJoin = useCallback((data) => {
    const { room } = data;
    navigate(`/room/${room}`);
  }, []);

  useEffect(() => {
    socket.on("room:join", handleJoin);
    return () => {
      socket.off("room:join", handleJoin);
    };
  }, [socket]);

  return (
    <>
      <h1>Lobby</h1>
      <form onSubmit={handleSubmitForm}>
        <label htmlFor="email">Email ID</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />

        <label htmlFor="room">Room Number</label>
        <input
          type="text"
          id="room"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />
        <br />

        <button type="submit">Join</button>
      </form>
    </>
  );
};

export default LobbyScreen;
