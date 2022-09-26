const express = require("express");
require("dotenv").config();
const app = express();
const port = 5000;
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const fileDir = `${process.cwd()}/products`;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, fileDir);
  },
  filename: (req, file, cb) => {
    const fileExt = path.extname(file.originalname);
    const fileName = file.originalname.replace(fileExt, '').toLowerCase().split(' ').join('-') + '-' + Date.now();
    cb(null, fileName + fileExt);
  }
})

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg') {
      cb(null, true);
    } else {
      cb(null, false);
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

    const userCollection = client
      .db("project-ecommerce")
      .collection("all-users");

    //  get all product
    app.get("/server/all-product", async (req, res) => {
      const result = await productsCollection.find({}).toArray();
      res.send(result);
    });

    // add product
    app.post("/server/add-product", async (req, res) => {
      const product = req.body;
      const result = await productsCollection.insertOne(product);
      res.send(result);
    });

    // get single product filter by id
    app.get("/server/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    });

    // post product
    app.post("/server/product", async (req, res) => {
      const result = await productsCollection.insertOne(req.body);
      res.send(result);
    });

    // delete single product
    app.delete("/server/product/:id", async (req, res) => {
      const id = req?.params?.id;
      const query = { _id: ObjectId(id) };
      const product = await productsCollection.findOne(query);
      const result = await productsCollection.deleteOne(query);
      fs.unlink(`${fileDir}/${product?.image}`, (err) => {
        console.log(err);
      });
      fs.unlink(`${fileDir}/${product?.img1}`, (err) => {
        console.log(err);
      });
      fs.unlink(`${fileDir}/${product?.img2}`, (err) => {
        console.log(err);
      });
      res.send(result);
    });

    // get all order
    app.get("/server/all-order", async (req, res) => {
      const result = await ordersCollection.find({}).toArray();
      res.send(result.reverse());
    });

    // order post api
    app.post("/server/order", async (req, res) => {
      const bodyData = req.body;
      const date = new Date();
      date.setTime(date.getTime() + (3 * 24 * 60 * 60 * 1000))
      // date.setTime(date.getTime() + (60 * 1000));
      const result = await ordersCollection.insertOne({...bodyData,"createdAt": date});
      res.send(result);
    });

    // order post api
    app.put("/server/order/:id", async (req, res) => {
      const body = req.body;
      const { id } = req.params;
      const result = await ordersCollection.updateOne({ _id: ObjectId(id) }, { $set: body }, { upsert: false });
      res.send(result);
    });

    // cancle order api
    app.delete("/server/cancel-order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await ordersCollection.deleteOne(query);
      res.send(result);
    });

    // all user start
    app.put("/server/user/:email", async (req, res) => {
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

    app.get("/server/alluser", async (req, res) => {
      const query = {};
      const result = await userCollection.find(query).toArray();
      res.send(result);
    });

    // make admin api
    app.patch("/server/make-admin/:email", async (req, res) => {
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
    app.get("/server/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user?.role === "admin";
      res.send({ admin: isAdmin });
    });

    // delete user api
    app.delete("/server/delete-user/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    // upload product image
    app.post('/server/upload', upload.fields([{ name: 'productImg', maxCount: 1 }, { name: 'productImg1', maxCount: 1 }, { name: 'productImg2', maxCount: 1 }]), (req, res) => {
      res.send({ ...req?.files, uploaded: true });
    })

    // get product image
    app.get('/server/file/:id', async (req, res) => {
      const { id } = req.params;
      const file = `${__dirname}/products/${id}`;
      res.sendFile(file);
    })

  } finally {
  }
}
run().catch(console.dir);

app.get("/server", (req, res) => {
  res.send("Project e-Commerce server is running!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
