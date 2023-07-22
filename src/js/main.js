import brain5000Json from '../brains/brain5000.json';
import {JellyBrain, costFuncs, activationFuncs} from '../../node_modules/jellybrain/src/JellyBrain.js'

let brain = new JellyBrain(784, 784, 10, costFuncs.crossEntropy, 0.01, activationFuncs.sigmoid, activationFuncs.softmax);
brain.importBrain(brain5000Json);

