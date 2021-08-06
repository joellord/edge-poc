import express from "express";
import cors from "cors";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";
import assert from "assert";

const __dirname = dirname(fileURLToPath(import.meta.url));
const wwwPath = `${__dirname}/www`;

const DB_SERVER = process.env.DB_SERVER || "";
const PORT = process.env.PORT || 3000;

const MONGODB_USER = "";
const MONGODB_PASS = "";
const MONGODB_CLUSTER = "";

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.sendFile(`${wwwPath}/index.html`);
});

app.get("/config", (req, res) => {
  res.send({
    DB_SERVER
  }).status(200);
});

app.get("/facedata", async (req, res) => {
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

  MongoClient.connect(
    `mongodb+srv://${MONGODB_USER}:${MONGODB_PASS}@${MONGODB_CLUSTER}.mongodb.net/edge-poc?authSource=admin&replicaSet=atlas-v6xmes-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true`,
    { useNewUrlParser: true, useUnifiedTopology: true },
    async function(connectErr, client) {
      assert.equal(null, connectErr);
      const coll = client.db('edge-poc').collection('people');
      let cursor = coll.find(filter, { projection: projection });
      let result = await cursor.toArray();
      res.send(result).status(200);
    });
});

app.use(express.static(wwwPath));

app.listen(PORT, () => console.log(`Server started on port ${PORT}`))