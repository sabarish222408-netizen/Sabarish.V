"use strict";

// These are assumptions for an educational estimate, not universal constants.
const GRAMS_PER_STANDARD_DRINK = 14;
const BAC_REDUCTION_PER_HOUR = 0.015;
const LEGAL_BENCHMARK = 0.08;
const DISTRIBUTION_FACTORS = {
  male: 0.68,
  female: 0.55,
};

const form = document.querySelector("#bac-form");
const result = document.querySelector("#result");
const resultValue = document.querySelector("#result-value");
const resultHeading = document.querySelector("#result-heading");
const resultMessage = document.querySelector("#result-message");

form.addEventListener("submit", (event) => {
  // Stop the browser from navigating away and let its required/min checks run.
  event.preventDefault();
  if (!form.reportValidity()) {
    return;
  }

  // Read the validated values from the form.
  const gender = form.elements.gender.value;
  const weightKg = Number(form.elements.weight.value);
  const drinks = Number(form.elements.drinks.value);
  const hours = Number(form.elements.hours.value);

  // Convert drinks to grams of alcohol, then apply the Widmark distribution factor.
  const alcoholGrams = drinks * GRAMS_PER_STANDARD_DRINK;
  const distributionFactor = DISTRIBUTION_FACTORS[gender];
  const bacBeforeMetabolism = alcoholGrams / (weightKg * distributionFactor * 10);

  // Estimate alcohol metabolized since the first drink; BAC cannot be below zero.
  const estimatedBac = Math.max(0, bacBeforeMetabolism - BAC_REDUCTION_PER_HOUR * hours);

  // Show the estimate as a percentage and compare it with the stated benchmark.
  resultValue.textContent = `${estimatedBac.toFixed(3)}%`;
  result.classList.remove("is-below", "is-above");

  if (estimatedBac < LEGAL_BENCHMARK) {
    result.classList.add("is-below");
    resultHeading.textContent = "Below the 0.08% benchmark";
    resultMessage.textContent = "This estimate is below the benchmark used here. The applicable legal limit may be different where you are.";
  } else {
    result.classList.add("is-above");
    resultHeading.textContent = "Impaired / unsafe to drive";
    resultMessage.textContent = "This estimate is at or above the 0.08% benchmark. Do not drive; arrange another way home.";
  }

  result.hidden = false;
});

const eyeVideo = document.querySelector("#eye-video");
const cameraPlaceholder = document.querySelector("#camera-placeholder");
const eyeTarget = document.querySelector("#eye-target");
const eyeStatus = document.querySelector("#eye-status");
const cameraStartButton = document.querySelector("#camera-start");
const cameraStopButton = document.querySelector("#camera-stop");
const eyeStartButton = document.querySelector("#eye-start");

const targetPositions = [
  [18, 20], [50, 18], [82, 22], [80, 50],
  [82, 80], [50, 78], [18, 80], [20, 50],
];
let cameraStream = null;
let targetTimer = null;

cameraStartButton.addEventListener("click", async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    eyeStatus.textContent = "Camera access is unavailable here. Open this page on localhost or HTTPS in a supported browser.";
    return;
  }

  cameraStartButton.disabled = true;
  eyeStatus.textContent = "Waiting for camera permission...";

  try {
    // Request video only. The stream is displayed locally and is never uploaded.
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "user" } },
      audio: false,
    });
    eyeVideo.srcObject = cameraStream;
    eyeVideo.hidden = false;
    cameraPlaceholder.hidden = true;
    await eyeVideo.play();
    cameraStopButton.disabled = false;
    eyeStartButton.disabled = false;
    eyeStatus.textContent = "Camera is on. Start the eye-following activity when ready.";
  } catch (error) {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      cameraStream = null;
    }
    eyeVideo.srcObject = null;
    eyeVideo.hidden = true;
    cameraPlaceholder.hidden = false;
    cameraStartButton.disabled = false;
    cameraStopButton.disabled = true;
    eyeStartButton.disabled = true;
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      eyeStatus.textContent = "Camera access was blocked. Allow camera access for this site in the browser and Windows camera privacy settings, then try again.";
    } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      eyeStatus.textContent = "No camera is available to this browser. Connect or enable a webcam, then retry. If one is connected, check Windows camera privacy settings.";
    } else if (error.name === "NotReadableError" || error.name === "AbortError") {
      eyeStatus.textContent = "The camera is busy or unavailable. Close other apps using it, check its connection, and retry.";
    } else if (error.name === "OverconstrainedError") {
      eyeStatus.textContent = "The camera could not meet the requested settings. Try another camera or check its driver.";
    } else {
      eyeStatus.textContent = `The camera could not start (${error.name || "unknown error"}). Check browser and Windows permissions, then retry.`;
    }
  }
});

eyeStartButton.addEventListener("click", () => {
  if (!cameraStream) {
    return;
  }

  clearInterval(targetTimer);
  eyeStartButton.disabled = true;
  eyeTarget.hidden = false;
  eyeStatus.textContent = "Follow the point with your eyes for one slow lap. This activity does not assess impairment.";
  let positionIndex = 0;

  const moveTarget = () => {
    if (positionIndex >= targetPositions.length) {
      clearInterval(targetTimer);
      targetTimer = null;
      eyeTarget.hidden = true;
      eyeStartButton.disabled = false;
      eyeStatus.textContent = "Activity complete. No impairment or driving-safety result can be inferred from this exercise.";
      return;
    }

    const [left, top] = targetPositions[positionIndex];
    eyeTarget.style.left = `${left}%`;
    eyeTarget.style.top = `${top}%`;
    positionIndex += 1;
  };

  moveTarget();
  targetTimer = window.setInterval(moveTarget, 1100);
});

cameraStopButton.addEventListener("click", stopCamera);
window.addEventListener("pagehide", stopCamera);

function stopCamera() {
  clearInterval(targetTimer);
  targetTimer = null;
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }

  eyeVideo.srcObject = null;
  eyeVideo.hidden = true;
  cameraPlaceholder.hidden = false;
  eyeTarget.hidden = true;
  cameraStartButton.disabled = false;
  cameraStopButton.disabled = true;
  eyeStartButton.disabled = true;
  eyeStatus.textContent = "Camera is off. Start the camera to begin.";
}