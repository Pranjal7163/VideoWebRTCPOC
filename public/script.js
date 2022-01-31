/**
 * dom elements
 */
const videoGrid = document.getElementById("video-grid");
const myVideo = document.querySelector(".newvideo");
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header__back");
const endCall = document.getElementById("endCall");
let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");
const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");

/**
 * global variables
 */
const socket = io("/");
let selfStream = null;
let userStream = null;
let recorder = null;
var myUserId = null;
var roomId = null;
var authToken = null;

let media_recorder = null;
let blobs_recorded = [];
var startedRecording = false;
var peerTimeStamp = 0.0;
var peerUserId = "";
const user = makeid(6);
let myVideoStream;
var peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "3030",
  config: {'iceServers': [
    { url: 'stun:18.134.127.127:3478' },
    { url: 'turn:18.134.127.127:3478', credential: 'amx123', username : 'amxdev' }
  ]}
  });

/**
 * set defaults
 */
myVideo.muted = true;

/**
 * load plugins
 */
 peer.on("open", (id) => {
  console.log("OPEN");
  myUserId = id;
  console.log("myUserID "+id);
  var roomIdLocal = ROOM_ID;  
  roomId = roomIdLocal;
  socket.on(roomId, function(data){
      if(data.userId != myUserId){
        console.log(data)
      }
    }
  );
  console.log("roomId "+roomId);
  var param = findGetParameter("param");
  socket.emit("join-room", roomId, id, user,param);
  
  emitPinger();
  
  setTimeout(initTimeoutCheck,1000);  
});

/**
 * start video
 */
navigator.mediaDevices
  .getUserMedia({
    audio: true,

    video: true,
  })
  .then((stream) => {
    console.log("Started video and audio capturing.");

    myVideoStream = stream;
    selfStream = stream;

    // show the captured stream on UI.
    addVideoStreamWithoutGrid(myVideo, stream);
    // setInterval(record_and_send, 5000);  Commented for testing
    peer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      video.className = "addvideo";
      call.on("stream", (userVideoStream) => {
        userStream = userVideoStream;
        addVideoStream(video, userVideoStream);
      });
    });

    peer.on('disconnected', function (data) {
      console.log('peer :: disconnection', {data : data});
    });

    // ????
    peer.on("close", function () {
      console.log("Connection destroyed");
    });

    // connection to node server socket
    socket.on("connection", function (socket) {
      console.log("socket :: connection ");

      socket.on("disconnect", function () {
        console.log(socket.id);
        prompt("Disconnected");
      });
    });

    // ????
    socket.on("user-connected", (userId) => {
      console.log("user-connected");
      console.log(userId);
      console.log(socket.id);
      connectToNewUser(userId, stream);
    });

    // ????
    socket.on("user-ping", (userId) => {
      console.log("PING " + userId);
      if (userId != myUserId) {
        peerTimeStamp = new Date().getTime();
        peerUserId = userId;
      }
    });

    socket.on("room-auth", (authTokenLocal) =>{
        if(authTokenLocal != null){
          console.log("room :: auth",{authToken : authTokenLocal});
          authToken = authTokenLocal;
        }
    });

    socket.on("user-disconnected", (roomIdRecieved)=>{
      console.log("disconnect-user");
      console.log("Recieved Room ID", roomIdRecieved);
      console.log("My Room ID", roomId);
      if (roomIdRecieved == roomId) {
        location.href = "/close/done";
      }
    });

    // ????
    socket.on("createMessage", (message, userName) => {
      if (message == "disconnect") {
        prompt("Disconnected");
      }
      messages.innerHTML =
        messages.innerHTML +
        `<div class="message">
             <b><i class="far fa-user-circle"></i> <span> ${
               userName === user ? "me" : userName
             }</span> </b>
             <span>${message}</span>
         </div>`;
    });

    // on tab close or navigate away from current tab.
    window.addEventListener(
      "beforeunload",
      function () {
        // ????
        socket.emit("message", myUserId);
      },
      false
    );
  });

/**
 * load listeners
 */
backBtn.addEventListener("click", () => {
  document.querySelector(".main__left").style.display = "flex";
  document.querySelector(".main__left").style.flex = "1";
  document.querySelector(".main__right").style.display = "none";
  document.querySelector(".header__back").style.display = "none";
});

showChat.addEventListener("click", () => {
  document.querySelector(".main__right").style.display = "flex";
  document.querySelector(".main__right").style.flex = "1";
  document.querySelector(".main__left").style.display = "none";
  document.querySelector(".header__back").style.display = "block";
});

endCall.onclick = async () => {
  console.log("hangupCalled");
  media_recorder.stop();
};

send.addEventListener("click", (e) => {
  if (text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

text.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

muteButton.addEventListener("click", () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    html = `<i class="fas fa-microphone-slash"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    html = `<i class="fas fa-microphone"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  }
});

stopVideo.addEventListener("click", () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    html = `<i class="fas fa-video-slash"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    html = `<i class="fas fa-video"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  }
});

inviteButton.addEventListener("click", (e) => {
  prompt(
    "Copy this link and send it to people you want to meet with",
    window.location.href
  );
});

/**
 * Methods
 */
// ????
const connectToNewUser = (userId, stream) => {
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  video.className = "addvideo";
  call.on("stream", (userVideoStream) => {
    userStream = userVideoStream;
    addVideoStream(video, userVideoStream);
  });
};

function record_and_send() {
  const recorder = new MediaRecorder(selfStream);
  const chunks = [];
  recorder.ondataavailable = (e) => chunks.push(e.data);
  recorder.onstop = (e) => download(new Blob(chunks));
  setTimeout(() => recorder.stop(), 5000); // we'll have a 5s media file
  recorder.start();
}

function download(blob) {
  const url = URL.createObjectURL(new Blob([blob], { type: "video/webm" }));
  let a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = "local.webm";
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function startRecording() {
  blobs_recorded = [];
  media_recorder = new MediaRecorder(selfStream, { mimeType: "video/webm" });

  // event : new recorded video blob available
  media_recorder.addEventListener("dataavailable", function (e) {
    console.log("blob recieved");
    blobs_recorded.push(e.data);
  });

  media_recorder.ondataavailable = function (blob) {
    var file = new File(
      [blob],
      "msr-" + new Date().toISOString().replace(/:|\./g, "-") + ".webm",
      {
        type: "video/webm",
      }
    );
    const url = URL.createObjectURL(new Blob([blob], { type: "video/webm" }));
    let a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "local.webm";
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // event : recording stopped & all blobs sent
  media_recorder.addEventListener("stop", function () {
    console.log("stopped");
  });

  // start recording with each recorded blob having 1 second video
  console.log("starting");
  media_recorder.start(4000);
  startedRecording = true;
}

function downloadFile(){
  console.log("download");
  media_recorder.stop();
};


endCall.onclick = async () => {
  console.log('hangupCalled');  
  downloadFile();
};



function emitPinger(){
  socket.emit("pinger",myUserId);
  checkPeerTimeout();
  if (AUTH_TOKEN != null){
    console.log("pinger :: authToken" , {authToken : AUTH_TOKEN});
    var authTokenLocal = AUTH_TOKEN;
    authToken = authTokenLocal;
    socket.emit("auth-token",authToken);
  }
  setTimeout(emitPinger,4000);
}

function initTimeoutCheck(){
  console.log("timout :: init",{start : peerTimeStamp});
  if(peerTimeStamp != 0.0){
    checkPeerTimeout();
  }
}

function checkPeerTimeout(){
  console.log("timeout :: client",{start : peerTimeStamp});
  if (peerTimeStamp != 0.0 ){
    var timeDiff = new Date().getTime() - peerTimeStamp;
    var secondsDifference = Math.floor(timeDiff/1000);
    console.log("timeout :: client",{diff : secondsDifference});
    if (secondsDifference < 10){
      console.log("peer live")
    }else{
      makePeerDisconnectionApiCall()
    }
  }

}

function makePeerDisconnectionApiCall() {
  //TODO Add Peer disconnection api using peerUserId variable
}

function reset() {
  videoGrid.forEach((e) => e.parentNode.removeChild(e));
}

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
    // video.muted = true
    videoGrid.append(video);
  });
};

const addVideoStreamWithoutGrid = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
    // videoGrid.append(video);
  });
};

function makeid(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  console.log("made ID" + result);
  return result;
}

function findGetParameter(parameterName) {
  var result = null,
    tmp = [];
  location.search
    .substr(1)
    .split("&")
    .forEach(function (item) {
      tmp = item.split("=");
      if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
    });
  return result;
}

async function makeAjaxCall(method, url, request = {}, options = {}) {
  if (!url || !method) return "Invalid arguments.";

  const remoteServerUrl = `https://appd2-kwt.amxremit.com`;
  url =
    method.toUpperCase() === "GET"
      ? `${url}?${"serialize=request" /* TODO */}`
      : url;
  try {
    const rawResponse = await fetch(`${remoteServerUrl}${url}`, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      ...(method.toUpperCase() === "POST"
        ? { body: JSON.stringify(request) }
        : {}),
    });
    return rawResponse.json();
  } catch (error) {
    throw new Error("Ajax call failed.");
  }
}

async function publishUserStatusToServices(
  status = "", // "PARTICIPANT_JOINED" || "PARTICIPANT_DISCONNECTED"
  data = {}
) {
  let {
    authToken = "",
    participantId = "",
    roomCode = "",
    displayName = "",
    participantIdType = "",
    participantIdentifier = "",
  } = data;
  try {
    let request = {
      authToken,
      data: {
        newParticipantData: {
          displayName,
          participantIdType,
          participantIdentifier,
          roomCode,
        },
        participantId,
      },
      event: status,
    };
    let response = await makeAjaxCall(
      "POST",
      "/pub/vc/update-chat-room",
      request
    );
    console.log("publishUserStatusToServices successful ", { response });
  } catch (error) {
    console.error("publishUserStatusToServices failed ", error);
  }
}
