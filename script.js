const $ = (selector, from = document) => {
  return from.querySelector(selector);
};

const video = $(".video");

function toXY(obj, prefix) {
  return {x: obj[prefix + "X"], y: obj[prefix + "Y"]};
}

let ratio;
let pos = {x: 0, y: 0};
let size = {x: video.clientWidth, y: video.clientHeight};
let prevMove;
let prevResize;
video.addEventListener("mousedown", event => {
  prevMove = toXY(event, "client");
  prevResize = toXY(event, "client");
});
video.addEventListener("mousemove", event => {
  if(event.buttons === 1) {
    const newPos = toXY(event, "client");
    pos.x += newPos.x - prevMove.x;
    pos.y += newPos.y - prevMove.y;
    prevMove = newPos;
  } else if(event.buttons === 2) {
    // FIXME: Cursor doesn't remain in same place
    // FIXME: Doesn't work with tall screens
    const oldSize = {x: size.x, y: size.y};
    const newResize = toXY(event, "client");
    aResize = {x: newResize.x - prevResize.x, y: newResize.y - prevResize.y};
    size.x += aResize.x * 2;
    size.y = size.x / ratio;
    pos.x -= (size.x - oldSize.x) / 2;
    pos.y -= (size.y - oldSize.y) / 2;
    prevResize = newResize;
  }
  video.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
  video.style.width = size.x + "px";
  video.style.height = size.y + "px";
});
video.addEventListener("contextmenu", event => {
  event.preventDefault();
});

async function userGesture() {
  if(!video.srcObject) {
    let stream;
    // FIXME: Add for navigator.mediaDevices.getDisplayMedia
    if(!navigator.getDisplayMedia) {
      stream = await navigator.mediaDevices.getUserMedia({video: {mediaSource: "screen"}});
    } else {
      stream = await navigator.getDisplayMedia({video: true});
    }
    video.srcObject = stream;
    // FIXME: Remove the timeout
    setTimeout(() => {
      const {width, height} = stream.getVideoTracks()[0].getSettings();
      console.log(width, height);
      ratio = width / height;
      size.x = width;
      size.y = height;
    }, 500);
  }
}

addEventListener("click", () => {
  userGesture();
});

addEventListener("keypress", ({key}) => {
  if(key && key.toUpperCase() === "H") {
    $(".instructions").hidden = true;
  }
});
