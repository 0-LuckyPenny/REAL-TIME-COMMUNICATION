const { Server } = require("socket.io");

const io = new Server(8000, {
  cors: true,
});

const emailToSocketIdMap = new Map();
const socketIdToEmailMap = new Map();

io.on("connection", (socket) => {
  console.log(`Socket Connected`, socket.id);

  socket.on("room:join", (data) => {
    const { email, room } = data;
    emailToSocketIdMap.set(email, socket.id);
    socketIdToEmailMap.set(socket.id, email);

    // if any user already there in room then other will join in and this user:joined event will be emit so that everyone in that room comes to knows that someone has joined
    io.to(room).emit("user:joined", { email, id: socket.id });

    // join that person
    socket.join(room);

    //server send this emit event to this particualar (to) person(socket.id)
    io.to(socket.id).emit("room:join", data);
  });

  socket.on("user:call", ({ toUser, offer }) => {
    // console.log("user:call", toUser, " ", offer);

    // send the offer of the user who call to the user whom to be called
    // socket.id is current user
    io.to(toUser).emit("incoming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:negotiation", ({ to, offer }) => {
    io.to(to).emit("peer:negotiation", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });
});
