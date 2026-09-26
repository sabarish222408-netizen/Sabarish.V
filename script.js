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