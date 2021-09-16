import fs from "fs";
import { MongoClient } from "mongodb";

const MONGODB_USER = "blog";
const MONGODB_PASS = "blog";
const MONGODB_CLUSTER = "cluster0.2grje";
const SOURCE_FILE = "short-withDescriptors.json";

if (!MONGODB_CLUSTER) {
  console.error("No MongoDB cluster was specified. Exiting.");
  process.exit(1);
}

const mongoClient = await MongoClient.connect(
  `mongodb+srv://${MONGODB_USER}:${MONGODB_PASS}@${MONGODB_CLUSTER}.mongodb.net/edge-poc?authSource=admin&replicaSet=atlas-v6xmes-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true`,
  { useNewUrlParser: true, useUnifiedTopology: true }
);

async function main() {
  const data = JSON.parse(fs.readFileSync(SOURCE_FILE).toString());

  try {
    await mongoClient.db("edge-poc").collection("people").drop();
  } catch (e) {
    console.log(e);
  }

  try {
    const res = await mongoClient
      .db("edge-poc")
      .collection("people")
      .insertMany(data);
    console.log(res);
    process.exit();
  } catch (e) {
    console.log(e);
  }
}

main();
