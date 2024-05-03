import brain5000Json from '../brains/brain5000.json';
import brain22000Json from '../brains/brain22000.json';
import {JellyBrain, costFuncs, activationFuncs} from '../../node_modules/jellybrain/src/JellyBrain.js';

// load the brain
let brain = new JellyBrain(784, 784, 10, costFuncs.crossEntropy, 0.01, activationFuncs.sigmoid, activationFuncs.softmax);
brain.importBrain(brain22000Json);


const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = 28;
canvas.height = 28;
let scale = getComputedStyle(document.body).getPropertyValue('--scale');
let coord = { x: 0, y: 0 };



// add event listeners
document.addEventListener("mousedown", start);
document.addEventListener("mouseup", stop);

// add button click
document.getElementById("clearButton").addEventListener("click", clear);
document.getElementById("guessButton").addEventListener("click", guess);

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

function clear()
{
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function guess()
{
    let image = [];
    for (let y = 0; y < 28; y++)
    {
        for (let x = 0; x < 28; x++)
        {
            let pixel = ctx.getImageData(x, y, 1, 1);
            image.push((pixel.data[3]) / (255));
        }
    }

    let guessArray = brain.guess(image);
    let guessNumber = guessArray.reduce((bestIndex, currentValue, currentIndex) =>
    {
        return guessArray[bestIndex] > currentValue ? bestIndex : currentIndex
    }, 0);
    let guessText = document.getElementById("guessText");
    guessText.innerHTML = JSON.stringify(guessNumber);
}