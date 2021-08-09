# Edge Computing POC
Sample face recognition application for edge computing POC.

The front-end (index.html) page will let you pick an image on your local machine. The image is then uploaded to the Node.js server for processing.

Node.js fetched a list of existing face descriptors (mathematical representation of faces) from MongoDB each time the /detect URL is hit.

## Installation

Install dependencies
```
npm install
```

Edit the file `index.js` to add your MongoDB cluster info.

Start the server
```
node .
```

Point your browser to [http://localhost:3000](http://localhost:3000)

## Import data

Using a JSON file with an array of images and names:

```
[
  {
      "imgSrc": "https://example.com/speaker/face.jpg",
      "name": "Speaker McSpeaking"
  },
  ...
]
```

Open the file `addFaceDescriptors.js`. Change line 12 to the name of your `.json` file. You can also specify an event id on line 13. Then run the script.

```
node addFaceDescriptors
```

For each item in the array, the script will
* Download the image to the `/tmp` folder (make sure it exists)
* Run the analyzer and find the face descriptors
* Create a new JSON object with the name, imgSrc, face descriptors and event id

The new array is the written to a file named `ORIGINAL-withDescriptors.json`. Once you have this file, you can import it to MongoDB using [Compass](https://www.mongodb.com/products/compass) (or [mongoimport](https://docs.mongodb.com/guides/server/import/)).