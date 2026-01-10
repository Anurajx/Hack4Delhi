const { MongoClient } = require("mongodb");

const uri = "";

async function test() {
  const client = new MongoClient(uri);
  await client.connect();

  const db = client.db("StateVoter");
  const collection = db.collection("tempVotersBLO");

  const count = await collection.countDocuments();
  const sample = await collection.findOne();

  console.log("Documents:", count);
  console.log("Sample record:", sample);

  await client.close();
}

test();
