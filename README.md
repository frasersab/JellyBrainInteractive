# JellyBrain Interactive
## Usage
Go to https://frasersab.github.io/JellyBrainInteractive/ to try and see if JellyBrain can guess the number you draw. It will also provide the probability distribution it bases it's guess off.

## Limitations
Because my laptop is slow, I have only trained the neural network on a subset of the MNIST dataset, so it will make many mistakes. However, as it is, it is better than random guessing!

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
It is critical that the correct label acopanies the correct pixel data.

## License
[ISC](https://choosealicense.com/licenses/isc/)