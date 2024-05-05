import brainBigJson from '../brains/brainBig.json';
import {JellyBrain, costFuncs, activationFuncs} from '../../node_modules/jellybrain/src/JellyBrain.js';
import Chart from 'chart.js/auto';

// load the brain
let brain = new JellyBrain(784, 784, 10, costFuncs.crossEntropy, 0.005, activationFuncs.sigmoid, activationFuncs.softmax);
brain.importBrain(brainBigJson);
document.getElementById('learningRate').value = brain.learningRate;


// setup the canvas
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = 28;
canvas.height = 28;
let scale = getComputedStyle(document.body).getPropertyValue('--scale');  // getting scale from the stylesheet
let coord = { x: 0, y: 0 };


// setup graph
let canvasChart = new Chart(
    document.getElementById('probabilityGraph'),
    {
      type: 'bar',
      data: {
        labels: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        datasets: [
          {
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          }
        ]
      },
      options: {
        plugins: {
          legend: {
              display: false
          }
        },
        responsive: false,
        maintainAspectRatio: false,
        scales: {
          y: {
            ticks: {
              precision: 1,
              callback: function(value, index, ticks) {
                        return value + '%';
                    }
            },
            min: 0,
            max: 100
          }
        }
      }
    }
  );


// add event listeners
document.addEventListener("mousedown", start);
document.addEventListener("mouseup", stop);


// add button listeners
document.getElementById("clearButton").addEventListener("click", clear);
document.getElementById("guessButton").addEventListener("click", guess);
document.getElementById("copyImageButton").addEventListener("click", copyImageData);
document.getElementById("copyBrainButton").addEventListener("click", copyBrainData);
document.getElementById('importButton').addEventListener("click", importBrain);
document.getElementById("trainButton").addEventListener("click", trainBrain);

// drawing functions
function reposition(event)
{
  coord.x = (event.clientX - canvas.offsetLeft) / scale;
  coord.y = (event.clientY - canvas.offsetTop) / scale;
}

function start(event)
{
  document.addEventListener("mousemove", draw);
  reposition(event);
}

function stop()
{
  document.removeEventListener("mousemove", draw);
}

function draw(event)
{
  ctx.beginPath();
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  ctx.strokeStyle = "black";
  ctx.moveTo(coord.x, coord.y);
  reposition(event);
  ctx.lineTo(coord.x, coord.y);
  ctx.stroke();
}

function updateChart(probability)
{
  canvasChart.data.datasets[0].data = probability.map((value) => value = value * 100)
  canvasChart.update();
}


// button functions
function clear()
{
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  guessText.innerHTML = "?";
  updateChart([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
}

function guess()
{
    let image = getImage();

    let guessArray = brain.guess(image);
    let guessNumber = guessArray.reduce((bestIndex, currentValue, currentIndex) =>
    {
        return guessArray[bestIndex] > currentValue ? bestIndex : currentIndex
    }, 0);
    let guessText = document.getElementById("guessText");
    guessText.innerHTML = JSON.stringify(guessNumber);
    updateChart(guessArray);
}


function copyImageData()
{
  let image = getImage(false);
  navigator.clipboard.writeText(JSON.stringify(image));
  alert("Image data copied to clipboard.");
}

function copyBrainData()
{
  let brainData = brain.exportBrain();
  navigator.clipboard.writeText(JSON.stringify(brainData));
  alert("Brain data copied to clipboard.");
}

function importBrain()
{
  var files = document.getElementById('selectFiles').files;
  if (files.length <= 0) {
    return false;
  }
  
  var fr = new FileReader();
  
  fr.onload = function(e) { 
    try
    {
      var result = JSON.parse(e.target.result);
    }
    catch (error)
    {
      console.log(error);
      alert("Cannot import new brain as an error occured during parsing. Please see console log for more details.");
    }
    if (!(result.hasOwnProperty("weightsIH") && result.hasOwnProperty("weightsHO") && result.hasOwnProperty("biasH") && result.hasOwnProperty("biasO")))
    {
      alert("Cannot import new brain as it is missing data.");
    }
    else
    {
      brain.importBrain(result);
      alert("New brain has been imported.");
    }
  }
  
  fr.readAsText(files.item(0));
}

function trainBrain()
{
  let image = getImage();
  let label = Number(document.getElementById('label').value);
  let learningRate = Number(document.getElementById('learningRate').value);
  if (isNaN(label))
  {
    alert("Cannot train because input label isn't a number.");
  }
  else if (label < 0 || label > 9)
  {
    alert("Cannot train because input label is invalid. Must be a number from 0 to 9.");
  }
  else if (isNaN(learningRate))
  {
    alert("Cannot train because learning rate isn't a number.");
  }
  else if (learningRate < 0 || learningRate > 1)
  {
    alert("Cannot train because learning rate is invalid. Must be a number from 0 to 1.");
  }
  else
  {
    if (brain.learningRate != learningRate)
    {
      brain.changeLearningRate(learningRate);
    }
    targetArray = new Array(10).fill(0);
    targetArray[label] = 1;
    brain.train(image, targetArray);
    guess();
  }
}

// helper functions
function getImage(squished = true)
{
  let image = [];
  for (let y = 0; y <= 27; y++)
  {
      for (let x = 0; x <= 27; x++)
      {
          let pixel = ctx.getImageData(x, y, 1, 1).data[3];
          if (squished)
            {
              pixel = pixel / 255
            }
          image.push(pixel);
      }
  }

  return image;
}