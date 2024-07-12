const express = require('express');
const cors = require ('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;


// middleware
app.use (cors ());
app.use (express.json ());




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
    const hotelBooking = client.db ('roomBooking').collection('rooms');
    const roomBooking = client.db ('roomBooking').collection ('booking');
   
    // get all rooms data from db
    app.get ('/rooms', async (req,res) => {
        const result = await hotelBooking.find().toArray()
        res.send(result)
    })

    // get a single room data from db using job id
    app.get ('/room/:id', async (req,res) => {
      const id = req.params.id
      const query = { _id: new ObjectId (id)}
      const result = await hotelBooking.findOne (query)
      res.send (result)
    })

    // Save a booking data in db
    app.post ('/booking', async (req,res) => {
      const booking =req.body
      const result = await roomBooking.insertOne(booking)
      res.send (result);
    })
  //   app.post('/booking', async (req, res) => {
  //     const booking = req.body;
  
  //     try {
  //         // Validate the request body
  //         if (!booking.bookingDate || !booking.email || !booking.photo || !booking.roomId) {
  //             return res.status(400).send({ message: 'Invalid booking data' });
  //         }
  
  //         // Check if the room is already booked
  //         const existingBooking = await roomBooking.findOne({ roomId: booking.roomId, bookingDate: booking.bookingDate });
  
  //         if (existingBooking) {
  //             return res.status(400).send({ message: 'This room is already booked on the selected date.' });
  //         }
  
  //         // Insert the booking
  //         const result = await roomBooking.insertOne(booking);
  
  //         // Update room availability
  //         await rooms.updateOne({ _id: booking.roomId }, { $set: { available: false } });
  
  //         res.send(result);
  //     } catch (error) {
  //         console.error(error);
  //         res.status(500).send({ message: 'Error booking the room', error });
  //     }
  // });
  
  

     // get all rooms posted by a specific user
     app.get ('/booking/:email', async (req,res) => {
      const email = req.params.email
      const query = { email}
      const result = await roomBooking.find(query).toArray()
      res.send (result)

    })


    // delete one rooms in db 
    app.delete ('/booking/:id', async (req,res) => {
      const id = req.params.id
      const query = { _id: new ObjectId (id)}
      const result = await roomBooking.deleteOne (query)
      res.send (result)
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


app.get ('/', (req,res) => {
    res.send ('Hotel server is running')
})

app.listen (port, () => {
    console.log (`Hotel Server is running on port ${port}`)
})