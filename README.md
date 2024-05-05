# JellyBrain Interactive
## Usage
Go to https://frasersab.github.io/JellyBrainInteractive/ to try and see if JellyBrain can guess the number you draw. It will also provide the probability distribution it bases it's guess off. You can also provide the actual number drawn and train the brain live, then watch how the probability distribution changes after training. Note that there is no server side processing so any training you do will not be saved unless you copy the brain and save it yourself.

## Limitations
This is a simple neural network and so has a limited accuracy. It needs numbers to be drawn centered and not off to one side as this is how the training dataset was made.

## Make more training data
If you want to make more training data please use the 'copy image data' button and save a JSON file with the following format:

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