const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.querySelector(".newvideo");
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header__back");
const endCall = document.getElementById('endCall');

let selfStream = null;
let userStream = null;
let recorder = null;
myVideo.muted = true;


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

const user = makeid(6);

var peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "443",
});

let myVideoStream;
navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    console.log("Start");
    myVideoStream = stream;
    selfStream = stream;
    addVideoStreamWithoutGrid(myVideo, stream);

    peer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      video.className = "addvideo"
      call.on("stream", (userVideoStream) => {
        userStream = userVideoStream;
        startRecording();
        addVideoStream(video, userVideoStream);
      });
    });

    peer.on('disconnected', function () {
      console.log('Connection lost. Please reconnect');
    });
    peer.on('close', function () {      
        console.log('Connection destroyed');
    });

    socket.on('connection', function (socket) {
      console.log('a user connected');
      socket.on('disconnect', function () {
          console.log(socket.id);
          prompt("Disconnected");
      });
    });

    socket.on("user-connected", (userId) => {
      console.log(userId);
      console.log(socket.id);
      connectToNewUser(userId, stream);
    });

    socket.on("user-disconnected", (userId)=>{
      console.log("disconnect-user");
      console.log(userId);
      location.href = "/close/done"
    });
    

    window.addEventListener('beforeunload', function () {
      socket.emit("disconnect");
  }, false);
  });
  

  

const connectToNewUser = (userId, stream) => {
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  video.className = "addvideo"
  call.on("stream", (userVideoStream) => {
    userStream = userVideoStream;
    startRecording();
    addVideoStream(video, userVideoStream);
  });
};

function startRecording(){
  var streamsList = [selfStream, userStream];
            const mixer = new MultiStreamsMixer(streamsList);
            mixer.startDrawingFrames();
            const mixedStream = mixer.getMixedStream();
            recorder = RecordRTC(mixedStream, {
                type: "video",
                mimeType: "video/webm",
                previewStream: function (s) {
                  
                }
              });
              recorder.startRecording();
}

function downloadFile(){
   
  recorder.stopRecording(() => {
      var blob = recorder.getBlob();
      const url = URL.createObjectURL(blob);
      console.log(url);
      let a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "local.webm";
      a.click();
      a.remove();
      URL.revokeObjectURL(url);        
    });
};


endCall.onclick = async () => {
  console.log('hangupCalled');  
  downloadFile();
};

peer.on("open", (id) => {
  console.log("OPEN");
  socket.emit("join-room", ROOM_ID, id, user);
});

function reset() {
  videoGrid.forEach((e) => e.parentNode.removeChild(e));
}

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
    video.muted = true
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
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * 
charactersLength));
 }
 return result;
}


let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");

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

const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");
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

socket.on("createMessage", (message, userName) => {
  if(message == "disconnect"){
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
