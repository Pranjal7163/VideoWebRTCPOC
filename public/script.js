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

var myUserId = null;
var roomId = null;

let media_recorder = null;
let blobs_recorded = [];
var startedRecording = false;

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

var peer = new Peer({
  config: {'iceServers': [
    { url: 'stun:stun.l.google.com:19302' },
    { url: 'turn:homeo@turn.bistri.com:80', credential: 'homeo' }
  ]} /* Sample servers, please use appropriate ones */
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
    setInterval(record_and_send, 5000);
    peer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      video.className = "addvideo"
      call.on("stream", (userVideoStream) => {
        userStream = userVideoStream;        
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

    socket.on("user-disconnected", (roomIdRecieved)=>{
      console.log("disconnect-user");
      console.log("Recieved Room ID",roomIdRecieved);
      console.log("My Room ID",roomId);
      if(roomIdRecieved == roomId){
        location.href = "/close/done"
      }
    });
    

    window.addEventListener('beforeunload', function () {
      socket.emit("message", myUserId);
  }, false);
  });
  

  

const connectToNewUser = (userId, stream) => {
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  video.className = "addvideo"
  call.on("stream", (userVideoStream) => {
    userStream = userVideoStream;       
    addVideoStream(video, userVideoStream);
  });
};

function record_and_send() {
  console.log("Record Called");
  const recorder = new MediaRecorder(selfStream);
  const chunks = [];
  recorder.ondataavailable = e => chunks.push(e.data);
  recorder.onstop = e => download(new Blob(chunks));
  setTimeout(()=> recorder.stop(), 5000); // we'll have a 5s media file
  recorder.start();
}


function download(blob){
  console.log("Download Called");
  const url = URL.createObjectURL(new Blob([blob], { type: 'video/webm' }));
        console.log(url);
        let a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = "local.webm";
        a.click();
        a.remove();
        URL.revokeObjectURL(url);  
}

function startRecording(){
  blobs_recorded = [];
  media_recorder = new MediaRecorder(selfStream, { mimeType: 'video/webm' });

    // event : new recorded video blob available 
    media_recorder.addEventListener('dataavailable', function(e) {
      console.log("blob recieved");
		  blobs_recorded.push(e.data);
    });

    media_recorder.ondataavailable = function(blob) {
      // upload each blob to PHP server
      // uploadToPHPServer(blob);
      var file = new File([blob], 'msr-' + (new Date).toISOString().replace(/:|\./g, '-') + '.webm', {
        type: 'video/webm'
      });
        const url = URL.createObjectURL(new Blob([blob], { type: 'video/webm' }));
        console.log(url);
        let a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = "local.webm";
        a.click();
        a.remove();
        URL.revokeObjectURL(url);  
  };

    // event : recording stopped & all blobs sent
    media_recorder.addEventListener('stop', function() {
      console.log("stopped");
    	// create local object URL from the recorded video blobs
    	// let video_local = URL.createObjectURL(new Blob(blobs_recorded, { type: 'video/webm' }));
    	// download_link.href = video_local;
      // blobs_recorded.forEach(blob => {
        // let single_blob_array = [];
        // single_blob_array.push(blob);        
      // })

    });

    // start recording with each recorded blob having 1 second video
    console.log("starting");
    media_recorder.start(4000);
    startedRecording = true;

  // var streamsList = [selfStream, userStream];
  //           const mixer = new MultiStreamsMixer(streamsList);
  //           mixer.startDrawingFrames();
  //           const mixedStream = mixer.getMixedStream();
  //           recorder = RecordRTC(mixedStream, {
  //               type: "video",
  //               mimeType: "video/webm",
  //               previewStream: function (s) {
                  
  //               }
  //             });
  //             recorder.startRecording();
}

function downloadFile(){
  console.log("download");
  media_recorder.stop(); 
  // const url = URL.createObjectURL(new Blob(blobs_recorded, { type: 'video/webm' }));
  //       console.log(url);
  //       let a = document.createElement("a");
  //       a.style.display = "none";
  //       a.href = url;
  //       a.download = "local.webm";
  //       a.click();
  //       a.remove();
  //       URL.revokeObjectURL(url);

  // recorder.stopRecording(() => {
  //     var blob = recorder.getBlob();
  //     const url = URL.createObjectURL(blob);
  //     console.log(url);
  //     let a = document.createElement("a");
  //     a.style.display = "none";
  //     a.href = url;
  //     a.download = "local.webm";
  //     a.click();
  //     a.remove();
  //     URL.revokeObjectURL(url);        
  //   });
};


endCall.onclick = async () => {
  console.log('hangupCalled');  
  downloadFile();
};

peer.on("open", (id) => {
  console.log("OPEN");
  myUserId = id;
  console.log("myUserID "+id);
  var roomIdLocal = ROOM_ID;
  roomId = roomIdLocal;
  console.log("roomId "+roomId);
  socket.emit("join-room", roomId, id, user);
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
