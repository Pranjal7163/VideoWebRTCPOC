const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
app.set("view engine", "ejs");
const io = require("socket.io")(server, {
  cors: {
    origin: '*'
  }
});

// io.configure(function () { 
//   io.set("transports", ["xhr-polling"]); 
//   io.set("polling duration", 10); 
// });

const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.use("/peerjs", peerServer);
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});


io.on("connection", (socket) => {
  console.log("connected");

  setTimeout(function(){
    console.log("socket timer");
    console.log(io.sockets.sockets.length);
  },1000)

//   socket.on("disconnect", (reason)=>{
//     console.log("disconnect");
//     socket.broadcast.emit("user-disconnected"); 
// });
  socket.on('disconnect',  (roomId) => {
    console.log("disconnect");
    console.log("room-id"+roomId);
    console.log(socket.id);
  });

  socket.on("leave-room", (roomId , userId) => {
    socket.to(roomId).broadcast.emit("user-disconnected", userId);
  });

  socket.on("join-room", (roomId, userId, userName) => {
    console.log("room-id"+roomId);
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", userId);
    socket.on('disconnect', function(){
      console.log("messageDisconnection");
      socket.broadcast.to(roomId).emit("user-disconnected", userName);
  });
    socket.on("message", (message) => {
      console.log("room-id"+roomId);
      io.to(roomId).emit("createMessage", message, userName);
    });
  });
});


server.listen(process.env.PORT || 3030);
