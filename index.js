const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require('mongodb');

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.socjvku.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
  try {
    await client.connect()
    const productsCollection = client.db('project-ecommerce').collection('all-products')

    app.post('/product', async (req, res) => {
      const result = await productsCollection.insertOne(req.body)
      res.send(result)
    })


    app.get('/all-product', async(req, res)=>{
      const result = await productsCollection.find({}).toArray()
      res.send(result)
    })

  }
  finally { }
}
run().catch(console.dir)


app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
