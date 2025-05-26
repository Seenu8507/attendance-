const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

const uri = "mongodb://localhost:27017";
const dbName = "exceluploaderdb";
const usersCollectionName = "login";

async function seedUsers() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);
    const usersCollection = db.collection(usersCollectionName);

    const usersFilePath = path.join(__dirname, "users.json");
    const usersData = JSON.parse(fs.readFileSync(usersFilePath, "utf-8"));

    for (const user of usersData) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await usersCollection.updateOne(
        { username: user.username },
        { $set: { password: hashedPassword } },
        { upsert: true }
      );
      console.log(`Seeded/Updated user ${user.username}`);
    }
  } catch (err) {
    console.error("Error seeding users:", err);
  } finally {
    await client.close();
  }
}

seedUsers();
