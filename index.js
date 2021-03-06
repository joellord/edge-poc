import express from "express";
import cors from "cors";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";
import faceapi from "face-api.js";
import nodeCanvas from "canvas";
import dotenv from "dotenv";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const wwwPath = `${__dirname}/www`;
const MODELS_PATH = `${__dirname}/models`;
const PORT = process.env.PORT || 3000;

// Connect to MongoDB 
const { MONGODB_USER, MONGODB_PASS, MONGODB_CLUSTER } = process.env;
if (!MONGODB_CLUSTER) {
  console.error("No MongoDB cluster was specified. Exiting.");
  process.exit(1);
}

const mongoClient = await MongoClient.connect(
  `mongodb+srv://${MONGODB_USER}:${MONGODB_PASS}@${MONGODB_CLUSTER}.mongodb.net/edge-poc?authSource=admin&replicaSet=atlas-v6xmes-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true`,
  { useNewUrlParser: true, useUnifiedTopology: true });

// Load face recognition models
await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODELS_PATH);
await faceapi.nets.faceLandmark68Net.loadFromDisk(MODELS_PATH);
await faceapi.nets.faceRecognitionNet.loadFromDisk(MODELS_PATH);

// Use Node Canvas and monkey patch FaceAPI.js
const { Canvas, Image, ImageData } = nodeCanvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });


// Initialize Server
const app = express();

app.use(cors());
app.use(express.static(wwwPath));
app.use(express.json({limit: '50mb'}));

app.get("/", (req, res) => {
  res.sendFile(`${wwwPath}/index.html`);
});

app.post("/detection", async (req, res) => {
  console.log("Face detection requested");

  //Load image in a node-canvas with a 500px height. Width is calculated to preserve ration
  let img = new Image();
  img.src = req.body.imgData;
  let canvas = new Canvas();
  let imageRatio = img.width / img.height;
  canvas.height = 500;
  canvas.width = 500 * imageRatio;
  let ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
  
  //Find the face descriptors for each face on this image
  let fullFaceDescriptions = await faceapi
    .detectAllFaces(img)
    .withFaceLandmarks()
    .withFaceDescriptors();
  let dim = new faceapi.Dimensions(canvas.width, canvas.height);
  fullFaceDescriptions = faceapi.resizeResults(fullFaceDescriptions, dim);

  //Fetch the face descriptors from MongoDB
  const filter = {
    'descriptors': {
      '$exists': true
    }, 
    'eventId': 'CodePaLOUsa'
  };
  const projection = {
    'name': 1, 
    'descriptors': 1, 
    '_id': 0
  };
  let coll = mongoClient.db('edge-poc').collection('people');
  let cursor = coll.find(filter, { projection: projection });
  let faceData = await cursor.toArray();

  // Create an array of existing face descriptors
  let labeledFaceDescriptors = faceData.map(desc => {
    let arr = Float32Array.from(desc.descriptors);
    return new faceapi.LabeledFaceDescriptors(desc.name, [arr]);
  });

  //Find the best matches using the faceMatcher
  const maxDescriptorDistance = 0.6;
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, maxDescriptorDistance);

  const results = fullFaceDescriptions.map(fd => faceMatcher.findBestMatch(fd.descriptor));

  // Format data to send back to the client
  let responseObject = [];
  results.forEach((bestMatch, i) => {
    let obj = {
      name: bestMatch.label,
      distance: bestMatch.distsance,
      box: fullFaceDescriptions[i].detection.box
    };
    responseObject.push(obj);
  });

  //Return the matching name
  res.send(responseObject).status(200);
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`))