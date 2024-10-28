import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import PeerServices from "../services/Peer"; // Import as a class

const RoomPage = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [videoEnable, setVideoEnabled] = useState(true);
  const [audioEnable, setAudioEnable] = useState(true);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]); // State to store chat messages

  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const myStream = useRef(null);

  // Callback to add received messages to the chat
  const handleReceivedMessage = (message) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { text: message, fromSelf: false },
    ]);
  };

  // Instantiate PeerServices with the callback for receiving messages
  const [peer] = useState(new PeerServices(handleReceivedMessage));

  const addMessage = (text, fromSelf) => {
    setMessages((prevMessages) => [...prevMessages, { text, fromSelf }]);
  };

  const toggleVideo = () => {
    if (myStream.current) {
      myStream.current
        .getVideoTracks()
        .forEach((track) => (track.enabled = !track.enabled));
      setVideoEnabled((prev) => !prev);
    }
  };

  const toggleAudio = () => {
    if (myStream.current) {
      myStream.current
        .getAudioTracks()
        .forEach((track) => (track.enabled = !track.enabled));
      setAudioEnable((prev) => !prev);
    }
  };

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log("Email", email, "has joined");
    setRemoteSocketId(id);
  }, []);

  const handleUserCall = useCallback(async () => {
    try {
      const offer = await peer.getCompleteOffer();
      socket.emit("user:call", { toUser: remoteSocketId, offer });
    } catch (error) {
      console.error("Error initiating call:", error);
    }
  }, [peer, remoteSocketId, socket]);

  const handleIncomingCall = useCallback(
    async ({ from, offer }) => {
      try {
        setRemoteSocketId(from);
        const answer = await peer.getAnswer(offer);
        socket.emit("call:accepted", { to: from, ans: answer });
      } catch (error) {
        console.error("Error handling incoming call:", error);
      }
    },
    [peer, socket]
  );

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
    },
    [peer]
  );

  const handleNegotiation = useCallback(async () => {
    const offer = await peer.getCompleteOffer();
    socket.emit("peer:negotiation", { offer, to: remoteSocketId });
  }, [peer, remoteSocketId, socket]);

  const handleIncomingNegotiation = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [peer, socket]
  );

  const handleNegotiationFinal = useCallback(
    async ({ ans }) => {
      await peer.setLocalDescription(ans);
    },
    [peer]
  );

  const handleIceCandidate = useCallback(
    ({ candidate }) => {
      if (candidate) {
        peer.addIceCandidate(new RTCIceCandidate(candidate));
      }
    },
    [peer]
  );

  useEffect(() => {
    const onIceCandidate = (event) => {
      if (event.candidate) {
        socket.emit("peer:candidate", {
          candidate: event.candidate,
          to: remoteSocketId,
        });
      }
    };

    peer.peer.onicecandidate = onIceCandidate;
    return () => {
      peer.peer.onicecandidate = null;
    };
  }, [peer, socket, remoteSocketId]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegotiation);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegotiation);
    };
  }, [peer, handleNegotiation]);

  useEffect(() => {
    peer.peer.addEventListener("track", (ev) => {
      const [stream] = ev.streams;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
    });
  }, [peer]);

  useEffect(() => {
    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        myStream.current = stream;
        if (myVideoRef.current) myVideoRef.current.srcObject = stream;
        stream.getTracks().forEach((track) => {
          peer.peer.addTrack(track, stream);
        });
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    };

    initMedia();

    return () => {
      myStream.current?.getTracks().forEach((track) => track.stop());
    };
  }, [peer]);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incoming:call", handleIncomingCall);
    socket.on("peer:candidate", handleIceCandidate);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:negotiation", handleIncomingNegotiation);
    socket.on("peer:nego:final", handleNegotiationFinal);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incoming:call", handleIncomingCall);
      socket.off("peer:candidate", handleIceCandidate);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:negotiation", handleIncomingNegotiation);
      socket.off("peer:nego:final", handleNegotiationFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncomingCall,
    handleIceCandidate,
    handleCallAccepted,
    handleIncomingNegotiation,
    handleNegotiationFinal,
  ]);

  const handleSendMessage = () => {
    peer.sendMessage(message);
    addMessage(message, true); // Add message to chat as from self
    setMessage("");
  };

  return (
    <div>
      <h1>Room Page</h1>
      <h2>{remoteSocketId ? "Connected" : "No one in room"}</h2>
      {remoteSocketId && <button onClick={handleUserCall}>Call</button>}
      <div>
        <h1>My Stream</h1>
        <video
          playsInline
          autoPlay
          height="500px"
          width="700px"
          style={{ transform: "scaleX(-1)" }}
          ref={myVideoRef}
        />
      </div>
      <div>
        <button onClick={toggleVideo}>
          {videoEnable ? "Turn off video" : "Turn on video"}
        </button>
        <button onClick={toggleAudio}>
          {audioEnable ? "Turn off audio" : "Turn on audio"}
        </button>
      </div>
      {remoteSocketId && (
        <div>
          <h1>Remote Stream</h1>
          <video
            playsInline
            autoPlay
            height="500px"
            width="700px"
            style={{ transform: "scaleX(-1)" }}
            ref={remoteVideoRef}
          />
        </div>
      )}
      {remoteSocketId && (
        <div>
          <h2>Chat</h2>
          <div className="chat-box">
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  border: "1px solid black",
                  textAlign: msg.fromSelf ? "right" : "left",
                  backgroundColor: msg.fromSelf ? "#BFECFF" : "#CDC1FF",
                  padding: "5px",
                  borderRadius: "8px",
                  margin: "5px",
                  maxWidth: "50%",
                  alignSelf: msg.fromSelf ? "flex-end" : "flex-start",
                }}>
                {msg.text}
              </div>
            ))}
          </div>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter message"
          />
          <button onClick={handleSendMessage}>Send Message</button>
        </div>
      )}
    </div>
  );
};

export default RoomPage;
