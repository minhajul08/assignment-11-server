const express = require('express');
const cors = require('cors');
const  jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://hotel-booking-c3d5e.web.app',
  ],
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())


// verify jwt middleware
const verifyToken = (req,res, next) => {
  const token = req.cookies?.token
  if (!token) return res.status (401).send ({ message: 'unauthorized access' })
  if (token) {
    jwt.verify(token, process.env.privateKey, (err, decoded) => {
      if (err){
        return res.status (401).send ({ message: 'unauthorized access' })
      }
      console.log (decoded)
      req.user = decoded
      next ()
    })
  }
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.01tlpf1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const hotelBooking = client.db('roomBooking').collection('rooms');
    const roomBooking = client.db('roomBooking').collection('booking');

    // jwt generate
    app.post ('/jwt', async (req,res) => {
      const user = req.body
      const token = jwt.sign (user, process.env.privateKey, {
        expiresIn: '1d'
      })
      res
      .cookie('token',token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      })
      .send ({ success: true })
    })

    // clear token on logout
    app.get ('/logout', (req,res) => {
      res
      .clearCookie ('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        maxAge: 0,
      })
      .send ({ success: true })
    })

    // get all rooms data from db
    app.get('/rooms',  async (req, res) => {
      const result = await hotelBooking.find().toArray()
      res.send(result)
    })

    // get a single room data from db using job id
    app.get('/room/:id',  async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await hotelBooking.findOne(query)
      res.send(result)
    })

    // Save a booking data in db
    app.post('/booking',  async (req, res) => {
      const booking = req.body;
      const existingBooking = await roomBooking.findOne({ email: booking.email });

      if (existingBooking) {
        res.status(400).send({ error: "You already have a booking" });
      } else {
        const result = await roomBooking.insertOne(booking);
        res.send(result);
      }
    });

    // get all rooms posted by a specific user
    app.get('/booking/:email',    async (req, res) => {
      // const tokenEmail = req.user.email
      const email = req.params.email
      // if (tokenEmail !== email) {
      //   return res.status (403).send ({ message: 'forbidden access' })
      // }
      const query = { email }
      const result = await roomBooking.find(query).toArray()
      res.send(result)

    })

    //  update booking date
    app.patch('/updateDate/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDate = req.body;
      const updateDoc = {
        $set: {
          bookingDate: updateDate.bookingDate
        }
      };
      const result = await roomBooking.updateOne(filter, updateDoc);
      res.send(result);
    });


    // delete one rooms in db 
    app.delete('/booking/:id',  async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await roomBooking.deleteOne(query)
      res.send(result)
    })



    // Connect the client to the server	(optional starting in v4.7)
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hotel server is running')
})

app.listen(port, () => {
  console.log(`Hotel Server is running on port ${port}`)
})