= Edge Computing POC
Sample face recognition application for edge computing POC.

The front-end (index.html) page will let you pick an image on your local machine. The image is then uploaded to the Node.js server for processing.

Node.js fetched a list of existing face descriptors (mathematical representation of faces) from MongoDB each time the /detect URL is hit.

== Installation

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
