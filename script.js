const $ = (selector, from = document) => {
  return from.querySelector(selector);
};
const $$ = (selector, from = document) => {
  return Array.from(from.querySelectorAll(selector));
};

const video = $(".video");
let done = false;

function goStep(step, previous) {
  const classCurrent = "instructions__step--current";
  if(previous) {
    previous.classList.remove(classCurrent);
    if(previous.classList.contains("instructions__step-adjust")) {
      video.classList.remove("video--adjust-with-text");
    }
  }
  step.classList.add(classCurrent);
  if(step.classList.contains("instructions__step-mirror")) {
    const tryShareScreen = (async () => {
      try {
        await shareScreen();
        goNextStep(step);
      } catch(error) {
        if(error === "not-installed") {
          goStep($(".instructions__step-extension"), getCurrentStep());
        } else {
          alert(error);
          throw error;
        }
      }
    });
    const tryButton = document.createElement("button");
    tryButton.textContent = "Försök igen";
    tryButton.addEventListener("click", tryShareScreen);
    step.appendChild(tryButton);
    tryShareScreen();
  } else if(step.classList.contains("instructions__step-adjust")) {
    video.classList.add("video--adjust-with-text");
  } else if(step.classList.contains("instructions__step-done")) {
    done = true;
    console.log("done");
  }
}

function getCurrentStep() {
  return $(".instructions__step--current");
}

function goNextStep(currentStep) {
  if(!currentStep) {
    currentStep = getCurrentStep();
  }
  let nextStep = currentStep.nextElementSibling;
  if(nextStep && nextStep.classList.contains("instructions__step")) {
    goStep(nextStep, currentStep);
  } else {
    throw new Error("No next step");
  }
}

const needsExtension = !navigator.getDisplayMedia && window.chrome;
let extensionScriptsLoaded;
if(needsExtension) {
  const loaded = [];
  const srcs = [
    "https://cdn.WebRTC-Experiment.com/getScreenId.js",
    "https://webrtc.github.io/adapter/adapter-latest.js"
  ];
  for(const src of srcs) {
    const script = document.createElement("script");
    script.src = src;
    loaded.push(new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = reject;
    }));
    document.head.appendChild(script);
  }
  extensionScriptsLoaded = Promise.all(loaded);
}

{
  if(!needsExtension) $(".instructions__step-extension").remove();
  const steps = $$(".instructions__step");
  for(const step of steps) {
    if(step.classList.contains("instructions__step--scripted")) continue;
    const button = document.createElement("button");
    button.classList.add("instructions__next");
    button.textContent = "(F)ortsätt";
    button.addEventListener("click", () => goNextStep(step));
    step.appendChild(button);
  }
  goStep(steps[0]);
}

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

async function pGetScreenID() {
  await extensionScriptsLoaded;
  return new Promise((resolve, reject) => {
    getScreenId(function(error, sourceID, constraints) {
        if(error) return reject(error);
        resolve({constraints, sourceID});
    });
  });
}

async function timeout(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

async function shareScreen() {
  if(!video.srcObject) {
    // TODO: Add for navigator.mediaDevices.getDisplayMedia?
    let stream;
    if(navigator.getDisplayMedia) {
      stream = await navigator.getDisplayMedia({video: true});
    } else if(window.chrome) {

      stream = await navigator.mediaDevices.getUserMedia((await pGetScreenID()).constraints);
    } else {
      stream = await navigator.mediaDevices.getUserMedia({video: {mediaSource: "screen"}});
    }
  	video.srcObject = stream;
    video.classList.remove("video--hidden");
  	// FIXME: Remove the timeout
    await timeout(500);
    const {width, height} = stream.getVideoTracks()[0].getSettings();
    console.log(width, height);
    ratio = width / height;
    size.x = width;
    size.y = height;
	}
}

addEventListener("keypress", ({key}) => {
  if(key && key.toUpperCase() === "F") {
	   const continueButton = $(".instructions__step--current .instructions__next");
     if(continueButton) continueButton.click();
  }
});

let cursorHideTimeout;
addEventListener("mousemove", () => {
  if(!done) return;
  document.body.classList.remove("no-cursor");
  clearTimeout(cursorHideTimeout);
  cursorHideTimeout = setTimeout(() => {
    document.body.classList.add("no-cursor")
  }, 1000)
}, {passive: true})
