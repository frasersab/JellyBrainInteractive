# JellyBrain Interactive
## Usage
Go to https://frasersab.github.io/JellyBrainInteractive/ to try and see if JellyBrain can guess the number you draw. It will also provide the probability distribution it bases it's guessed off. You can also provide the actual number drawn and train the brain live, then watch how the probability distribution changes after training. Note that there is no server-side processing so any training you do will not be saved unless you copy the brain and save it yourself.

## Network Visualisation
Open the visualisations tab to see a heatmap of the weights. You can get a greater idea of how the neural network is making its guesses and truly see the impact training has. For example, try training with a learning rate of 1 and see how it saturates all the neurons.

## Limitations
- The training data used is based off the MNIST dataset. The drawing in this application is meant to look similar to this dataset but doesn't quite match the same aesthetic, limiting the accuracy.
- Drawn numbers are meant to be centred and take up roughly 80% of the drawing area. As there is no pre-processing numbers drawn in a corner or at an angle will result in an inaccurate guess.

## Make more training data
If you want to make more training data, please use the 'copy image data' button and save a JSON file with the following format:

```
[
    {
        "index" : 0,
        "label" : 6,
        "pixels" : [0,0,...,0,0]    // this will contain 784 values
    },
    {
        "index" : 1,
        "label" : 2,
        "pixels" : [0,0,...,0,0]    // this will contain 784 values
    },
    {
        "index" : 2,
        "label" : 5,
        "pixels" : [0,0,...,0,0]    // this will contain 784 values
    }
]
```
It is critical that the correct label acopanies the correct pixel data or it will incorrectly train.

## License
[ISC](https://choosealicense.com/licenses/isc/)