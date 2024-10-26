import React, { useCallback, useEffect, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import peer from "../services/Peer";

const RoomPage = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [videoEnable, setVideoEnabled] = useState(true);
  const [audioEnable, setAudioEnable] = useState(true);

  const toggleVideo = () => {
    if (myStream) {
      myStream
        .getVideoTracks()
        .forEach((track) => (track.enabled = !track.enabled));

      setVideoEnabled(false);
    }
  };

  const toggleAudio = () => {
    if (myStream) {
      myStream
        .getAudioTracks()
        .forEach((track) => (track.enabled = !track.enabled));
      setAudioEnable(false);
    }
  };

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log("Email", email, "has joined");
    setRemoteSocketId(id);
  }, []);

  const sendStream = useCallback(() => {
    myStream.getTracks().forEach((track) => {
      peer.peer.addTrack(track, myStream);
    });
  }, [myStream]);



  const handleUserCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      const offer = await peer.getOffer();

      socket.emit("user:call", { toUser: remoteSocketId, offer });
      setMyStream(stream);
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  }, [remoteSocketId, socket]);

  const handleIncomingCall = useCallback(
    async ({ from, offer }) => {
      try {
        console.log("Incoming Call", from, offer);
        setRemoteSocketId(from);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setMyStream(stream);

        const ans = await peer.getAnswer(offer);
        socket.emit("call:accepted", { to: from, ans });
      } catch (error) {
        console.error("Error handling incoming call:", error);
      }
    },
    [socket]
  );



  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log("Call Accepted!");
      sendStream();
    },
    [sendStream]
  );



  const handleNegotiation = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:negotiation", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  const handleIncomingNegotiation = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegotiationFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);



  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegotiation);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegotiation);
    };
  }, [handleNegotiation]);



  useEffect(() => {
    peer.peer.addEventListener("track", (ev) => {
      const [stream] = ev.streams;
      setRemoteStream(stream);
    });
  }, []);



  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incoming:call", handleIncomingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:negotiation", handleIncomingNegotiation);
    socket.on("peer:nego:final", handleNegotiationFinal);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incoming:call", handleIncomingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:negotiation", handleIncomingNegotiation);
      socket.off("peer:nego:final", handleNegotiationFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncomingCall,
    handleCallAccepted,
    handleIncomingNegotiation,
    handleNegotiationFinal,
  ]);


  
  return (
    <div>
      <h1>Room Page</h1>
      <h2>{remoteSocketId ? "Connected" : "No one in room"}</h2>
      {myStream && <button onClick={sendStream}>Accept Call</button>}
      {remoteSocketId && <button onClick={handleUserCall}>Call</button>}
      {myStream && (
        <>
          <div>
            <h1>My Stream</h1>
            <video
              playsInline
              autoPlay
              height="500px"
              width="700px"
              style={{ transform: "scaleX(-1)" }}
              ref={(video) => {
                if (video) video.srcObject = myStream;
              }}
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
        </>
      )}
      {remoteStream && (
        <div>
          <h1>Remote Stream</h1>
          <video
            playsInline
            autoPlay
            height="500px"
            width="700px"
            style={{ transform: "scaleX(-1)" }}
            ref={(video) => {
              if (video) video.srcObject = remoteStream;
            }}
          />
        </div>
      )}
    </div>
  );
};

export default RoomPage;
