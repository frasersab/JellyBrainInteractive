import brain5000Json from '../brains/brain5000.json';
import brain22000Json from '../brains/brain22000.json';
import {JellyBrain, costFuncs, activationFuncs} from '../../node_modules/jellybrain/src/JellyBrain.js';
import Chart from 'chart.js/auto';

// load the brain
let brain = new JellyBrain(784, 784, 10, costFuncs.crossEntropy, 0.01, activationFuncs.sigmoid, activationFuncs.softmax);
brain.importBrain(brain22000Json);


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
document.getElementById("copyButton").addEventListener("click", copyData);


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
  guessText.innerHTML = "My guess will show here!";
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

function copyData()
{
  let image = getImage(false);
  navigator.clipboard.writeText(JSON.stringify(image));
  alert("Copied image data.");
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