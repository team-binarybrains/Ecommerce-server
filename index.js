const express = require("express");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const fileDir = `${process.cwd()}/products`;

const storage = multer.diskStorage({
  destination: (req,file,cb)=> {
      cb(null, fileDir);
  },
  filename: (req,file,cb)=> {
      const fileExt = path.extname(file.originalname);
      const fileName = file.originalname.replace(fileExt,'').toLowerCase().split(' ').join('-')+'-'+Date.now();
      cb(null,fileName+fileExt);
  }
})

const upload = multer({
  storage: storage,
  fileFilter: (req,file,cb)=> {
    if (file.mimetype === 'image/png' ||
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/png') {
        cb(null,true);
    }else{
      cb(null,false);
    }
  }
})

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.socjvku.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const productsCollection = client
      .db("project-ecommerce")
      .collection("all-products");
    const ordersCollection = client
      .db("project-ecommerce")
      .collection("all-orders");
    const cartCollection = client
      .db("project-ecommerce")
      .collection("cart-products");

    const userCollection = client
      .db("project-ecommerce")
      .collection("all-users");

    //  get all product
    app.get("/all-product", async (req, res) => {
      const result = await productsCollection.find({}).toArray();
      res.send(result);
    });

    // add product
    app.post("/add-product", async (req, res) => {
      const product = req.body;
      const result = await productsCollection.insertOne(product);
      res.send(result);
    });

    // get single product filter by id
    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    });

    // post product
    app.post("/product", async (req, res) => {
      const result = await productsCollection.insertOne(req.body);
      res.send(result);
    });

    // delete single product
    app.delete("/product/:id", async (req, res) => {
      const id = req?.params?.id;
      const query = {_id: ObjectId(id)};
      const product = await productsCollection.findOne(query);
      const result = await productsCollection.deleteOne(query);
      fs.unlink(`${fileDir}/${product?.image}`,(err)=> {
          console.log(err);
      });
      res.send(result);
    });

    // get all order
    app.get("/all-order", async (req, res) => {
      const result = await ordersCollection.find({}).toArray();
      res.send(result);
    });

    // order post api
    app.post("/order", async (req, res) => {
      const result = await ordersCollection.insertOne(req.body);
      res.send(result);
    });
    
    // add to cart
    app.put("/cart/:id", async (req, res) => {
      const id = req.params.id;
      const cartProduct = req.body;
      const filter = { _id: id };
      const options = { upsert: true };
      const updateDoc = {
        $set: cartProduct,
      };
      const result = await cartCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    // cancle order api
    app.delete("/cancel-order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await ordersCollection.deleteOne(query);
      res.send(result);
    });

    // all user start
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    app.get("/alluser", async (req, res) => {
      const query = {};
      const result = await userCollection.find(query).toArray();
      res.send(result);
    });

    // make admin api
    app.patch("/make-admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: { role: "admin" },
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    // get admin api
    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user?.role === "admin";
      res.send({ admin: isAdmin });
    });

    // delete user api
    app.delete("/delete-user/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    app.post('/upload', upload.single('productImg'), (req,res)=> {
      res.send({...req?.file,uploaded:true});
    })

    app.get('/file/:id', async (req,res)=> {
      const {id} = req.params;
      const file = `${__dirname}/products/${id}`;
      res.sendFile(file);
    })
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Project e-Commerce server is running!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
