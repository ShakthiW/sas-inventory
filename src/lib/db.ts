import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI is not set in environment variables");
}

declare global {
  var _mongoClient: MongoClient | undefined;
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "production") {
  client = new MongoClient(uri);
  clientPromise = client.connect();
} else {
  if (!global._mongoClient) {
    global._mongoClient = new MongoClient(uri);
  }
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = global._mongoClient.connect();
  }
  client = global._mongoClient;
  clientPromise = global._mongoClientPromise;
}

export async function getDb() {
  const connectedClient = await clientPromise;
  return connectedClient.db();
}
