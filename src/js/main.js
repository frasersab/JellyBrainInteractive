import brainBigJson from "../brains/brainBig.json";
import brain0Json from "../brains/brain0.json";
import brain32000Json from "../brains/brain32000.json";
import { JellyBrain, costFuncs, activationFuncs } from "../../node_modules/jellybrain/src/JellyBrain.js";
import Chart from "chart.js/auto";

// Constants
const NEURONS_PER_PAGE = 20;
const CANVAS_SIZE = 28;
const COMBINED_CANVAS_SIZE = 196;
const NEURON_CANVAS_SIZE = 70
const BRAIN_LAYER_SIZE = 784

// Store available brains
const availableBrains = {
  brainBig: brainBigJson,
  brain0: brain0Json,
  brain32000: brain32000Json,
};

// Initialize and load the brain
let brain = new JellyBrain(BRAIN_LAYER_SIZE, BRAIN_LAYER_SIZE, 10, costFuncs.crossEntropy, 0.003, activationFuncs.sigmoid, activationFuncs.softmax);
brain.importBrain(brainBigJson);
document.getElementById("learningRate").value = brain.getLearningRate();

// Cache for visualisations
const cache = {
  brain: {
    acitvationsUndefined: true,
    hiddenActivations: undefined,
    outputActivations: undefined,
    weightsIH: brain.getWeightsIH(),
    weightsHO: brain.getWeightsHO(),
  },
  heatmaps: {
    hiddenNeurons: new Array(784).fill(null),
    outputNeurons: new Array(10).fill(null),
    hiddenNeuronsCombined: null,
  },
  activeNeuronIndices: [],
  image: new Array(784).fill(0),
};

// Application states
const states = {
  inputOutOfSync: false,
  sortMethod: "index",
  currentPage: 1,
  totalPages: 1,
  threshold: 0.5,
  showOnlyActive: true,
  applyInput: false,
}

// Drawing setup
const drawLineWidth = 1.5;
const drawLineCap = "round";
const drawColor = "black";

// Canvas setup
const canvasDrawing = document.getElementById("canvasDrawing");
const ctx = canvasDrawing.getContext("2d", {willReadFrequently: true});
canvasDrawing.width = CANVAS_SIZE;
canvasDrawing.height = CANVAS_SIZE;
let scale = getComputedStyle(document.body).getPropertyValue("--scale");
let coord = { x: 0, y: 0 };

// Setup chart
let canvasChart = new Chart(document.getElementById("canvasGraph"), {
  type: "bar",
  data: {
    labels: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    datasets: [
      {
        data: Array(10).fill(0),
      },
    ],
  },
  options: {
    plugins: {
      legend: {
        display: false,
      },
    },
    responsive: false,
    maintainAspectRatio: false,
    scales: {
      y: {
        ticks: {
          precision: 1,
          callback: function (value) {
            return value + "%";
          },
        },
        min: 0,
        max: 100,
      },
    },
  },
});

// Event Listeners
function setupEventListeners() {
  // Touch events
  canvasDrawing.addEventListener("touchstart", startTouch);
  document.addEventListener("touchend", stopTouch);

  // Mouse events
  canvasDrawing.addEventListener("mousedown", startClick);
  document.addEventListener("mouseup", stopClick);

  // Buttons and dropdowns
  document.getElementById("clearButton").addEventListener("click", handleClear);
  document.getElementById("guessButton").addEventListener("click", handleGuess);
  document.getElementById("copyImageButton").addEventListener("click", handleCopyImageData);
  document.getElementById("copyBrainButton").addEventListener("click", handleCopyBrainData);
  document.getElementById("importButton").addEventListener("click", handleCustomBrainImport);
  document.getElementById("brainSelect").addEventListener("change", handleSelectedBrainImport);
  document.getElementById("trainButton").addEventListener("click", handleTrainBrain);

  // Collapsible sections
  document.getElementById("toggleTraining").addEventListener("click", () => toggleSection("training"));
  document.getElementById("toggleExtras").addEventListener("click", () => toggleSection("extras"));
  document.getElementById("toggleVisualisation").addEventListener("click", toggleVisualisationSection);

  // Pagination
  document.getElementById("prevPage").addEventListener("click", () => handlePageChange(states.currentPage - 1));
  document.getElementById("nextPage").addEventListener("click", () => handlePageChange(states.currentPage + 1));
  document.getElementById("firstPage").addEventListener("click", () => handlePageChange(1));
  document.getElementById("lastPage").addEventListener("click", () => handlePageChange(states.totalPages));

  // Visualisation controls
  document.getElementById("neuronSortMethod").addEventListener("change", handleSortMethodChange);
  document.getElementById("activationThreshold").addEventListener("input", handleThresholdChange);
  document.getElementById("showOnlyActive").addEventListener("change", handleVisualisationOptionChange);
  document.getElementById("applyInput").addEventListener("change", handleApplyInputChange);
}

setupEventListeners();

// Drawing functions
function updateCoordinate(event, isTouch = false) {
  const { left, top } = canvasDrawing.getBoundingClientRect();
  if (isTouch) {
    const touch = event.touches[0];
    coord.x = (touch.clientX - left) / scale;
    coord.y = (touch.clientY - top) / scale;
  } else {
    coord.x = (event.clientX - left) / scale;
    coord.y = (event.clientY - top) / scale;
  }
}

function drawLine(fromCoord, toCoord) {
  ctx.beginPath();
  ctx.lineWidth = drawLineWidth;
  ctx.lineCap = drawLineCap;
  ctx.strokeStyle = drawColor;
  ctx.moveTo(fromCoord.x, fromCoord.y);
  ctx.lineTo(toCoord.x, toCoord.y);
  ctx.stroke();

  // Signal that input is out of sync with the cache
  states.inputOutOfSync = true;

  // Show warning if changed input affects visuals
  if (isVisualisationOpen() && states.applyInput) {
    updateVisualisationNotes();
  }
}

// Touch drawing handlers
function startTouch(event) {
  document.addEventListener("touchmove", drawTouch);
  updateCoordinate(event, true);
}

function stopTouch() {
  document.removeEventListener("touchmove", drawTouch);
}

function drawTouch(event) {
  const prevCoord = { ...coord };
  updateCoordinate(event, true);
  drawLine(prevCoord, coord);
}

// Click drawing handlers
function startClick(event) {
  document.addEventListener("mousemove", drawClick);
  updateCoordinate(event);
}

function stopClick() {
  document.removeEventListener("mousemove", drawClick);
}

function drawClick(event) {
  const prevCoord = { ...coord };
  updateCoordinate(event);
  drawLine(prevCoord, coord);
}

// Chart update function
function updateChart(probability) {
  canvasChart.data.datasets[0].data = probability.map((value) => value * 100);
  canvasChart.update();
}

// Core functionality
function handleClear() {
  ctx.clearRect(0, 0, canvasDrawing.width, canvasDrawing.height);
  document.getElementById("guessText").innerHTML = "?";
  updateChart(Array(10).fill(0));

  // Mark activations as undefined
  cache.brain.acitvationsUndefined = true;
  cache.brain.image = new Array(784).fill(0);
  states.inputOutOfSync = false;
  
  if (isVisualisationOpen()) {
    updateVisualisationSection();
  }
}

function handleGuess() {
  // guess wrapper as event listener will pass in an event as an argument
  guess();
}

function guess(image = undefined) {
  if (image === undefined) {
    image = getImage();
  }
  // Cache the input in case it is changed
  cache.image = image;

  const guessArray = brain.guess(image);
  const guessNumber = guessArray.indexOf(Math.max(...guessArray));

  document.getElementById("guessText").innerHTML = guessNumber;
  updateChart(guessArray);

  // Update activations cache
  cache.brain.hiddenActivations = brain.getHiddenA();
  cache.brain.outputActivations = brain.getOutputA();
  cache.brain.acitvationsUndefined = false;
  states.inputOutOfSync = false;

  // Only update visuals if they are visable
  if (isVisualisationOpen()) {
    updateVisualisationSection();
  }
}

function handleTrainBrain() {
  const image = getImage();
  const label = Number(document.getElementById("label").value);
  const learningRate = Number(document.getElementById("learningRate").value);

  if (!validateTrainingInputs(label, learningRate)) return;

  if (brain.getLearningRate() != learningRate) {
    brain.setLearningRate(learningRate);
  }

  const targetArray = Array(10).fill(0);
  targetArray[label] = 1;

  brain.train(image, targetArray);

  // Update cache
  cache.brain.weightsIH = brain.getWeightsIH();
  cache.brain.weightsHO = brain.getWeightsHO();
  cache.heatmaps.hiddenNeurons = new Array(784).fill(null);
  cache.heatmaps.outputNeurons = new Array(10).fill(null),
  cache.heatmaps.hiddenNeuronsCombined = null;

  // When the brain is trained the activations become undefined
  cache.brain.acitvationsUndefined = true
  cache.brain.hiddenActivations = undefined;
  cache.brain.outputActivations = undefined;

  guess(image);
}

function validateTrainingInputs(label, learningRate) {
  if (isNaN(label)) {
    alert("Cannot train because input label isn't a number.");
    return false;
  }
  if (label < 0 || label > 9) {
    alert("Cannot train because input label is invalid. Must be a number from 0 to 9.");
    return false;
  }
  if (isNaN(learningRate)) {
    alert("Cannot train because learning rate isn't a number.");
    return false;
  }
  if (learningRate < 0 || learningRate > 1) {
    alert("Cannot train because learning rate is invalid. Must be a number from 0 to 1.");
    return false;
  }
  return true;
}

// Data export functions
function handleCopyImageData() {
  const image = getImage(false);
  navigator.clipboard.writeText(JSON.stringify(image));
  alert("Image data copied to clipboard.");
}

function handleCopyBrainData() {
  const brainData = brain.exportBrain();
  navigator.clipboard.writeText(JSON.stringify(brainData));
  alert("Brain data copied to clipboard.");
}

function isValidBrainData(data) {
  return (
    data &&
    data.hasOwnProperty("weightsIH") &&
    data.hasOwnProperty("weightsHO") &&
    data.hasOwnProperty("biasH") &&
    data.hasOwnProperty("biasO")
  );
}

// Brain import functionality
function handleCustomBrainImport() {
  const files = document.getElementById("selectFiles").files;
  if (files.length <= 0) {
    alert("Please select a file containing brain data first.");
    return;
  }

  const fr = new FileReader();

  fr.onload = function (e) {
    try {
      const brainData = JSON.parse(e.target.result);

      if (!isValidBrainData(brainData)) {
        alert("Cannot import new brain as it is missing required data.");
        return;
      }
      
      importhisBrain(brainData, "custom brain")
    }
    catch(error) {
      console.error(error);
      alert("Cannot import new brain due to parsing error. See console for details.");
    }
  };

  fr.readAsText(files.item(0));
}

function handleSelectedBrainImport(event) {
  const selectedBrain = event.target.value;
  const customFileInput = document.getElementById("customBrainUpload");

  if (selectedBrain === "custom") {
    customFileInput.style.display = "block";
  } else {
    customFileInput.style.display = "none";

    if (availableBrains[selectedBrain]) {
      importhisBrain(availableBrains[selectedBrain], selectedBrain)
    }
  }
}

function importhisBrain(brainData, brainName) {
  try {
    brain.importBrain(brainData)

    // Update cache
    cache.brain.weightsIH = brain.getWeightsIH();
    cache.brain.weightsHO = brain.getWeightsHO();
    cache.heatmaps.hiddenNeurons = new Array(784).fill(null);
    cache.heatmaps.outputNeurons = new Array(10).fill(null),
    cache.heatmaps.hiddenNeuronsCombined = null;

    // When a new brain is imported the activations become undefined
    cache.brain.acitvationsUndefined = true
    cache.brain.hiddenActivations = undefined;
    cache.brain.outputActivations = undefined;
  
    handleClear()
    alert(`${brainName} has been loaded.`);
  }
  catch(error) {
    console.error(error);
    alert("Cannot import brain due to parsing error. See console for details.");
  }
}

// Section toggle functions
function toggleSection(sectionName) {
  const content = document.getElementById(`${sectionName}Content`);
  const arrow = document.getElementById(`${sectionName}Arrow`);

  const isHidden = content.style.display === "none";
  content.style.display = isHidden ? "block" : "none";
  arrow.style.transform = isHidden ? "rotate(180deg)" : "rotate(0deg)";
}

function toggleVisualisationSection() {
  const content = document.getElementById("visualisationContent");
  const arrow = document.getElementById("visualisationArrow");

  if (content.style.display === "none") {
    // Show loading spinner
    content.style.display = "block";
    arrow.style.transform = "rotate(180deg)";
    document.getElementById("loadingSpinner").style.display = "flex";

    setTimeout(() => {    // TODO consider changing to requestAnimationFrame() from setTimeout
      updateVisualisationSection();
      document.getElementById("loadingSpinner").style.display = "none";
    }, 10);
  } else {
    content.style.display = "none";
    arrow.style.transform = "rotate(0deg)";
  }
}

// Visualisation section event listeners
function handlePageChange(newPage) {
  const maxPage = states.totalPages;
  if (newPage < 1 || newPage > maxPage) return;

  if (newPage !== states.currentPage) {
    states.currentPage = newPage;
    updateVisualisationSection();
  }
}

function handleThresholdChange() {
  const thresholdValue = document.getElementById("activationThreshold").value;
  const threshold = parseInt(thresholdValue) / 100;

  if (threshold !== states.threshold) {
    // Update threshold value display
    document.getElementById("thresholdValue").textContent = `${thresholdValue}%`;

    if ((states.threshold < threshold) && (cache.activeNeuronIndices.length === 0)) {
      // If the threshold increased and there is already no active neurons, only update threshold
      states.threshold = threshold;
      return;
    }
    else if ((states.threshold > threshold) && (cache.activeNeuronIndices.length === BRAIN_LAYER_SIZE)) {
      // If the threshold decreased and all neurons are active, only update threshold
      states.threshold = threshold;
      return;
    }

    states.threshold = threshold;
    states.currentPage = 1;
    updateVisualisationSection();
  }
}

function handleVisualisationOptionChange() {
  const showOnlyActive = document.getElementById("showOnlyActive").checked;

  if (showOnlyActive !== states.showOnlyActive) {
    states.showOnlyActive = showOnlyActive;
    states.currentPage = 1;
    updateVisualisationSection();
  }
}

function handleApplyInputChange() {
  const applyInput = document.getElementById("applyInput").checked;
  if (applyInput !== states.applyInput) {
    states.applyInput = applyInput;
    updateVisualisationSection();
  }
}

function handleSortMethodChange() {
  const sortMethod = document.getElementById("neuronSortMethod").value;

  if (sortMethod !== states.sortMethod) {
    states.sortMethod = sortMethod;
    states.currentPage = 1;
    updateVisualisationSection();
  }
}

// Visualisation functions
function updateVisualisationSection() {
  // Update active neurons
  updateActiveNeuronIndices();

  // Get neurons to display
  const neuronsToDisplay = getNeuronsToDisplay();

  // Update visualisation texts
  updatePaginationStates(neuronsToDisplay.length);
  updateVisualisationTexts(neuronsToDisplay.length)

  // Update visualisation tip
  updateVisualisationNotes();

  // Update info text
  updateVisualisationInfo();

  // Update hidden neurons combined heatmap
  updateHiddenNeuronCombinedHeatmap();

  // Update hidden neurons heatmap grid
  updateHiddenNeuronsHeatmap(neuronsToDisplay);

  // Update output neurons heatmap grid
  updateOutputNeuronHeatmap();  
  
}

function updateActiveNeuronIndices() {
  if(cache.brain.acitvationsUndefined) {
    // If brain activations undefined, then there is no current activation data to work with so set to an empty list
    cache.activeNeuronIndices = []
  } else {
    cache.activeNeuronIndices = cache.brain.hiddenActivations
      .map((value, index) => ({ value, index }))
      .filter((item) => item.value >= states.threshold)
      .map((item) => item.index);
  }
}

function getNeuronsToDisplay() {
  let indicesToSort;
  if (states.showOnlyActive) {
    indicesToSort = [...cache.activeNeuronIndices];
    // if there is nothing to sort then return it
    if (indicesToSort == []) {
      return indicesToSort;
    }
  } else {
    indicesToSort = [...Array(BRAIN_LAYER_SIZE).keys()];
  }

  // Apply sorting based on method
  return sortNeurons(indicesToSort, states.sortMethod);
}

function sortNeurons(indicesToSort, sortMethod) {
  // Sort by index if activations are undefined, as this means there is no current activation data to sort by
  if ((sortMethod === "index") || cache.brain.acitvationsUndefined) {
    return indicesToSort.sort((a, b) => a - b);
  }

  switch (sortMethod) {
    case "activation-desc":
      return indicesToSort.sort((a, b) => {
        const aValue = cache.brain.hiddenActivations[a] || 0;
        const bValue = cache.brain.hiddenActivations[b] || 0;
        return bValue - aValue;
      });
    case "activation-asc":
      return indicesToSort.sort((a, b) => {
        const aValue = cache.brain.hiddenActivations[a] || 0;
        const bValue = cache.brain.hiddenActivations[b] || 0;
        return aValue - bValue;
      });

    default:
      return indicesToSort;
  }
}


function updateVisualisationNotes() {
  const visualisationWarning = document.getElementById("visualisationWarning");
  const visualisationTip = document.getElementById("visualisationTip");

  // Warning note
  if (states.inputOutOfSync && states.applyInput) {
    visualisationWarning.style.display = "block";
  } else {
    visualisationWarning.style.display = "none";
  }

  // Tip note
  if (
    !cache.brain.acitvationsUndefined &&
    cache.activeNeuronIndices.length === 0 &&
    states.showOnlyActive
  ) {
    visualisationTip.textContent = "Tip: No neurons meet the current activation threshold. Try lowering the threshold.";
    visualisationTip.style.display = "block";
  } else if (cache.brain.acitvationsUndefined) {
    visualisationTip.textContent = "Tip: Draw and guess a digit to see which neurons activate!";
    visualisationTip.style.display = "block";
  } else {
    visualisationTip.style.display = "none";
  }
}

function updateVisualisationInfo() {
  const infoElement = document.getElementById("visualisationInfo");
  infoElement.innerHTML = "";

  let mainText = "Visualisation of hidden layer neurons showing their learned feature detectors";
  
  if (!cache.brain.acitvationsUndefined) {
    mainText += ". Green borders indicate neurons with activation above the threshold";
  }

  infoElement.appendChild(document.createTextNode(mainText));

  if (states.applyInput) {
    infoElement.appendChild(document.createElement("br"));
    infoElement.appendChild(document.createTextNode("Weights are multiplied with the current input to highlight active patterns"));
  }
}

function updateHiddenNeuronCombinedHeatmap() {
  const combinedContainer = document.getElementById("combinedContainer");
  combinedContainer.innerHTML = "";

  const activeNeurons = [...cache.activeNeuronIndices];

  const combinedCanvas = document.createElement("canvas");
  combinedCanvas.width = COMBINED_CANVAS_SIZE;
  combinedCanvas.height = COMBINED_CANVAS_SIZE;
  combinedCanvas.className = "combined-canvas";

  // If no active neurons, draw an empty/neutral heatmap
  if (activeNeurons.length === 0) {
    drawEmptyHeatmap(combinedCanvas);
    combinedContainer.appendChild(combinedCanvas);

    // Only show message if there's a guess but no neurons meet threshold
    if (!cache.brain.acitvationsUndefined) {
      const combinedDesc = document.createElement("p");
      combinedDesc.className = "combined-description";
      combinedDesc.textContent = "No neurons meet the current activation threshold.";
      combinedContainer.appendChild(combinedDesc);
    }
    return;
  }

  // Generate combined weights from active neurons
  let combinedWeights, activationValue = null;
  let neuronCount = 0;

  if (cache.heatmaps.hiddenNeuronsCombined !== null) {
    // Use cached weights if available
    combinedWeights = cache.heatmaps.hiddenNeuronsCombined.weights;
  } else {
    // Prepare combined weights
    combinedWeights = new Array(784).fill(0);

    // Combine weights from active neurons only
    for (let neuronIndex of activeNeurons) {
      const multiplier = cache.brain.hiddenActivations[neuronIndex];

      for (let i = 0; i < 784; i++) {
        combinedWeights[i] += cache.brain.weightsIH[i][neuronIndex] * multiplier;
      }
      neuronCount++;
    }

    // Normalize by number of neurons
    if (neuronCount > 0) {
      combinedWeights = combinedWeights.map((w) => w / neuronCount);
    }
  }

  // Draw the combined with input applied if enabled
  drawHeatmap(combinedCanvas, combinedWeights, states.applyInput);

  // Add combined description
  const combinedDesc = document.createElement("p");
  combinedDesc.className = "combined-description";
  let descText = `Combined weights from ${neuronCount} active neuron${neuronCount !== 1 ? "s" : ""}.`;

  if (states.applyInput && activationValue !== null) {
    descText += ` Activation: ${activationValue}%`;
  }

  combinedDesc.textContent = descText;

  combinedContainer.appendChild(combinedCanvas);
  combinedContainer.appendChild(combinedDesc);
}

function drawEmptyHeatmap(canvas) {
  const ctx = canvas.getContext("2d");
  const cellSize = canvas.width / CANVAS_SIZE;

  ctx.fillStyle = "#e0e0e0";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGridLines(ctx, cellSize);
}

function updateHiddenNeuronsHeatmap(neuronsToDisplay) {
  // Clear previous content
  const visualisationGrid = document.getElementById("visualisationGrid");
  visualisationGrid.innerHTML = "";

  // Get subset for current page
  const startIndex = (states.currentPage - 1) * NEURONS_PER_PAGE;
  const endIndex = Math.min(startIndex + NEURONS_PER_PAGE, neuronsToDisplay.length);
  const pageNeurons = neuronsToDisplay.slice(startIndex, endIndex);

  if (pageNeurons.length === 0) {
    displayNoNeuronsMessage();
    return;
  }

  const neuronsGrid = document.createElement("div");
  neuronsGrid.className = "neurons-grid";

  // Create grid for current page neurons
  for (let neuronIndex of pageNeurons) {
    let weightsToVisualise;

    if (cache.heatmaps.hiddenNeurons[neuronIndex] !== null) {
      weightsToVisualise = cache.heatmaps.hiddenNeurons[neuronIndex];
    } else {
      weightsToVisualise = Array.from({ length: 784 }, (_, i) => cache.brain.weightsIH[i][neuronIndex]);
      cache.heatmaps.hiddenNeurons[neuronIndex] = weightsToVisualise;
    }

    const neuronCell = createNeuronCell(neuronIndex, weightsToVisualise, states.threshold, states.applyInput);
    neuronsGrid.appendChild(neuronCell);
  }
  visualisationGrid.appendChild(neuronsGrid);
}

function displayNoNeuronsMessage() {
  const noNeuronsMsg = document.createElement("div");
  noNeuronsMsg.className = "no-neurons-message";
  noNeuronsMsg.textContent = "No neurons meet the current activation threshold.";
  document.getElementById("visualisationGrid").appendChild(noNeuronsMsg);
}

function createNeuronCell(neuronIndex, weights, threshold, applyInput) {
  const neuronCell = document.createElement("div");
  neuronCell.className = "visualisation-cell";

  if (!cache.brain.acitvationsUndefined && cache.brain.hiddenActivations[neuronIndex] >= threshold) {
    neuronCell.classList.add("active-neuron");
  }

  const canvas = document.createElement("canvas");
  canvas.width = NEURON_CANVAS_SIZE;
  canvas.height = NEURON_CANVAS_SIZE;

  // Draw weights with or without input applied
  drawHeatmap(canvas, weights, applyInput);

  const label = document.createElement("div");
  label.className = "neuron-label";
  let labelText = `N${neuronIndex}`;
  if (!cache.brain.acitvationsUndefined) {
    labelText += ` (${(cache.brain.hiddenActivations[neuronIndex] * 100).toFixed(0)}%)`;
  }
  label.textContent = labelText;

  neuronCell.appendChild(canvas);
  neuronCell.appendChild(label);

  return neuronCell;
}

function updateOutputNeuronHeatmap() {
  const container = document.getElementById("visualisationGrid");

  const outputSection = document.createElement("div");
  outputSection.className = "visualisation-section";

  const outputHeader = document.createElement("h3");
  outputHeader.textContent = "Output Layer Predictions";
  outputSection.appendChild(outputHeader);


  const outputDescription = document.createElement("p");
  outputDescription.className = "visualisation-info";
  outputDescription.appendChild(document.createTextNode("Shows which input patterns contribute most strongly to each digit's prediction"));

  if (states.applyInput) {
    outputDescription.appendChild(document.createElement("br"));
    outputDescription.appendChild(document.createTextNode("Weights are multiplied with the current input to highlight active patterns"));
  }
  outputSection.appendChild(outputDescription);

  const outputGrid = document.createElement("div");
  outputGrid.className = "neurons-grid";

  let compositeOutputWeights;

  for (let digit = 0; digit < 10; digit++) {
    if (cache.heatmaps.outputNeurons[digit] !== null) {
      compositeOutputWeights = cache.heatmaps.outputNeurons[digit];
    } else {
      compositeOutputWeights = getCompositeOutputWeights(digit);
      cache.heatmaps.outputNeurons[digit] = compositeOutputWeights
    }
    outputGrid.appendChild(createOutputCell(digit, compositeOutputWeights, states.applyInput));
  }

  outputSection.appendChild(outputGrid);
  container.appendChild(outputSection);
}

function getCompositeOutputWeights(digit) {
  // Calculate composite weights
  let compositeWeights = new Array(784).fill(0);

  for (let h = 0; h < BRAIN_LAYER_SIZE; h++) {
    const hiddenToOutputWeight = cache.brain.weightsHO[h][digit];
    for (let i = 0; i < 784; i++) {
      compositeWeights[i] += cache.brain.weightsIH[i][h] * hiddenToOutputWeight;
    }
  }
  return compositeWeights;
}

function createOutputCell(digit, compositeWeights, applyInput) {
  const digitCell = document.createElement("div");
  digitCell.className = "visualisation-cell";

  const canvas = document.createElement("canvas");
  canvas.width = NEURON_CANVAS_SIZE;
  canvas.height = NEURON_CANVAS_SIZE;

  let activationValue = null;
  if (!cache.brain.acitvationsUndefined) {
    activationValue = (cache.brain.outputActivations[digit] * 100).toFixed(1);
  }

  // Draw weights with or without input applied
  drawHeatmap(canvas, compositeWeights, applyInput);

  const label = document.createElement("div");
  label.className = "neuron-label";
  let labelText = `Digit ${digit}`;
  if (activationValue !== null) {
    labelText += ` (${activationValue}%)`;
  }
  label.textContent = labelText;

  digitCell.appendChild(canvas);
  digitCell.appendChild(label);

  return digitCell;
}


function updatePaginationStates(numberOfNeuronsToShow) {
  states.totalPages = Math.max(1, Math.ceil(numberOfNeuronsToShow / NEURONS_PER_PAGE));
  if (states.currentPage > states.totalPages) {
    states.currentPage = states.totalPages;
  }
}

function updateVisualisationTexts(numberOfNeuronsToShow) {
  // Update activation threshold neuron count
  document.getElementById("activeNeuronCount").textContent = numberOfNeuronsToShow;
  document.getElementById("totalNeuronCount").textContent = BRAIN_LAYER_SIZE;

  // Update page numbers and total neuron count
  document.getElementById("currentPageSpan").textContent = states.currentPage;
  document.getElementById("totalPagesSpan").textContent = states.totalPages;
  document.getElementById("totalNeuronsSpan").textContent = numberOfNeuronsToShow;

  // Update pagination controls
  document.getElementById("firstPage").disabled = states.currentPage <= 1;
  document.getElementById("prevPage").disabled = states.currentPage <= 1;
  document.getElementById("nextPage").disabled = states.currentPage >= states.totalPages;
  document.getElementById("lastPage").disabled = states.currentPage >= states.totalPages;
}

function drawHeatmap(canvas, weights, applyInput) {
  const ctx = canvas.getContext("2d");
  const cellSize = canvas.width / CANVAS_SIZE;

  // Clear canvas
  ctx.fillStyle = "#f0f0f0";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (applyInput) {
    weights = weights.map((weight, index) => weight * cache.image[index]);
  }

  // Find normalization factor (with safety check)
  const absMax = Math.max(0.0001, ...weights.map(Math.abs));

  // Draw activated weights as heatmap
  for (let y = 0; y < CANVAS_SIZE; y++) {
    for (let x = 0; x < CANVAS_SIZE; x++) {
      const index = y * CANVAS_SIZE + x;
      const normalizedValue = weights[index] / absMax;

      ctx.fillStyle = getWeightColor(normalizedValue);
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }

  // Draw grid lines
  drawGridLines(ctx, cellSize);
}

function getWeightColor(normalizedValue) {
  let r = 128, g = 128, b = 128;

  if (normalizedValue > 0) {
    // Shades of red for positive
    r = 255;
    g = Math.round(255 * (1 - normalizedValue));
    b = Math.round(255 * (1 - normalizedValue));
  } else if (normalizedValue < 0) {
    // Shades of blue for negative
    r = Math.round(255 * (1 - Math.abs(normalizedValue)));
    g = Math.round(255 * (1 - Math.abs(normalizedValue)));
    b = 255;
  }

  return `rgb(${r}, ${g}, ${b})`;
}

function drawGridLines(ctx, cellSize) {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
  ctx.lineWidth = 0.5;

  // Vertical lines
  for (let x = 0; x <= CANVAS_SIZE; x++) {
    ctx.beginPath();
    ctx.moveTo(x * cellSize, 0);
    ctx.lineTo(x * cellSize, CANVAS_SIZE * cellSize);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = 0; y <= CANVAS_SIZE; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * cellSize);
    ctx.lineTo(CANVAS_SIZE * cellSize, y * cellSize);
    ctx.stroke();
  }
}

function initializeVisualisationSettings() {
  states.threshold = parseInt(document.getElementById("activationThreshold").value) / 100;
  states.showOnlyActive = document.getElementById("showOnlyActive").checked;
  states.applyInput = document.getElementById("applyInput").checked;
}

function isVisualisationOpen() {
  return document.getElementById("visualisationContent").style.display !== "none";
}

function getImage(squished = true) {
  const image = [];
  const imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  const pixels = imageData.data;

  for (let y = 0; y < CANVAS_SIZE; y++) {
    for (let x = 0; x < CANVAS_SIZE; x++) {
      let alpha = pixels[(y * CANVAS_SIZE + x) * 4 + 3]; // read alpha
      if (squished) alpha = alpha / 255;
      image.push(alpha);
    }
  }

  return image;
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", function () {
  // Set initial display states
  document.getElementById("trainingContent").style.display = "none";
  document.getElementById("extrasContent").style.display = "none";
  document.getElementById("visualisationContent").style.display = "none";

  // Set initial arrow directions
  const arrows = ["training", "extras", "visualisation"];
  arrows.forEach((section) => {
    document.getElementById(`${section}Arrow`).style.transform = "rotate(0deg)";
  });

  // Initialize visualisation settings
  initializeVisualisationSettings();
});
