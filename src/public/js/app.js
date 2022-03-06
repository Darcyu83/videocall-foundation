const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

const call = document.getElementById("call");

call.hidden = true;
let myStream;
let myPeerConnection;
let muted = false;
let cameraOff = false;
let roomName;

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const currentCamera = myStream.getVideoTracks()[0];

    camerasSelect.innerHTML = "";
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (currentCamera.label === camera.label) {
        option.selected = true;
      }
      camerasSelect.append(option);
    });
  } catch (error) {
    console.log(error);
  }
}
async function getMedia(deviceId) {
  const initialConstraints = {
    audio: true,
    video: true,
  };

  const cameraConstraints = {
    audio: true,
    video: { deviceId: { exact: deviceId } },
  };

  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstraints : initialConstraints
    );

    if (!deviceId) await getCameras();

    myFace.srcObject = myStream;
  } catch (error) {
    console.log(error);
  }
}

function handleMuteClick() {
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (!muted) {
    muteBtn.innerText = "Unmute";
    muted = true;
  } else {
    muteBtn.innerText = "Mute";
    muted = false;
  }
}

function handleCameraClick() {
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (!cameraOff) {
    cameraBtn.innerText = "Trun Camera On";
    cameraOff = true;
  } else {
    cameraBtn.innerText = "Trun Camera Off";
    cameraOff = false;
  }
}

async function handleCameraChange(e) {
  await getMedia(e.target.value);
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);

// Welcome Form

const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

async function initCall() {
  welcome.hidden = true;
  call.hidden = false;
  await getMedia();
  await makeConnection();
}

async function handleWelcomeSubmit(e) {
  e.preventDefault();
  const input = welcomeForm.querySelector("input");
  roomName = input.value;

  await initCall();
  socket.emit("join_room", roomName);
  input.value = "";
}
welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// Socket Code

socket.on("welcome", async () => {
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  console.log("send the offer");
  socket.emit("offer", offer, roomName);
});

socket.on("offer", async (offer) => {
  console.log("recieve the offer");
  myPeerConnection.setLocalDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  console.log("send the answer");
  socket.emit("answer", answer, roomName);
});

socket.on("answer", (answer) => {
  console.log("recieve the answer");
  myPeerConnection.setLocalDescription(answer);
});

socket.on("ice", (ice) => {
  console.log("recieve the ICE");
  myPeerConnection.addIceCandidate(ice);
});
//RTC Code

async function makeConnection() {
  myPeerConnection = new RTCPeerConnection();
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("addstream", handleAddStream);
  const tracks = await myStream.getTracks();
  tracks.forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data) {
  console.log("got Ice candiate & SEND");
  socket.emit("ice", data.candidate, roomName);
  console.log(data);
}
function handleAddStream(data) {
  console.log("got an stream from my peer");
  const peersFace = document.getElementById("peersFace");

  peersFace.srcObject = data.stream;
  console.log(data.stream);
  console.log(myStream);
}
