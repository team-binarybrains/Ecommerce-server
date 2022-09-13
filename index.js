const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.socjvku.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
  try {
    await client.connect()
    const productsCollection = client.db('project-ecommerce').collection('all-products')
    const ordersCollection = client.db('project-ecommerce').collection('all-orders')

    //  get all product
    app.get('/all-product', async (req, res) => {
      const result = await productsCollection.find({}).toArray()
      res.send(result)
    })

    // get single product filter by id
    app.get('/product/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: ObjectId(id) }
      const result = await productsCollection.findOne(query)
      res.send(result)
    })

    // post product
    app.post('/product', async (req, res) => {
      const result = await productsCollection.insertOne(req.body)
      res.send(result)
    })


    // delete single product
    app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
  })

    // get all order
    app.get('/all-order', async(req, res)=>{
      const result = await ordersCollection.find({}).toArray()
      res.send(result)
    })

    // order post api
    app.post('/order', async (req, res) => {
      const result = await ordersCollection.insertOne(req.body)
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
