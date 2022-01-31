const express = require("express");
const app = express();
const server = require("http").Server(app);
// const { v4: uuidv4 } = require("uuid");
const { Api } = require("./axios");

app.use(express.static("public"));

app.set("view engine", "ejs");

const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});
app.use("/peerjs", peerServer);

app.get("/", async (req, res) => {
  let responseData;
  try {
    const request = {
      participantIdType: req.query.participantIdType || "CIVIL_ID",
      participantIdentifier: req.query.participantIdentifier || "280111000088",
    };
    const response = await Api.post("/pub/vc/create-chat-room", request);
    responseData = response.data.results[0];
    console.log("/pub/vc/create-chat-room successful ", {
      request,
      responseData,
    });
  } catch (error) {
    console.log("/pub/vc/create-chat-room failed ", error);
  }

  if (responseData) {
    res.redirect(
      `/${responseData.roomCode}?authToken=${responseData.authToken}`
    );
  } else {
    res.send({
      message: "Failed to initiate call",
    });
  }
});

app.get("/:room", (req, res) => {
  res.render("room", {
    roomId: req.params.room,
    authToken: req.query.authToken,
  });
});

app.get("/agent/:room", (req, res) => {
  res.render("agent", { roomId: req.params.room ,authToken : req.params.authToken});
});

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});
// io.configure(function () {
//   io.set("transports", ["xhr-polling"]);
//   io.set("polling duration", 10);
// });
console.log("socket :: instance ");
io.on("connection", (socket) => {
  console.log("socket :: connection ");

  // socket.on("disconnect", (reason) => {
  //   console.log("disconnect");
  //   socket.broadcast.emit("user-disconnected");
  // });

  // socket.on("disconnect", (roomId) => {
  //   console.log("disconnect");
  //   console.log("room-id" + roomId);
  //   console.log(socket.id);
  // });

  socket.on("leave-room", (roomId, userId) => {
    console.log("socket :: leave-room ", { roomId, userId });

    socket.to(roomId).broadcast.emit("user-disconnected", userId);
  });


  socket.on("join-room", (roomId, userId, userName, param) => {
    console.log("socket :: join-room ", { roomId, userId, userName, param });

    socket.join(roomId);

    io.to(roomId).emit("user-connected", userId);

    socket.on("disconnect", function (data) {
      console.log("socket :: disconnect ", { data, roomId });
      socket.broadcast.to(roomId).emit("user-disconnected", roomId);
    });

    socket.on("message", (message) => {
      console.log("socket :: message ", { message, roomId });

      // socket.broadcast.to(roomId).emit("createMessage", message, userName);
      io.to(roomId).emit("createMessage", message, userName);
    });
    socket.on("pinger",(user_id) => {
      io.to(roomId).emit("user-ping", userId);
    })

    socket.on("auth-token",(authToken) => {
      console.log("socket :: authToken",authToken);
      io.to(roomId).emit("room-auth", authToken);
    })
  });
});

server.listen(process.env.PORT || 3030);
