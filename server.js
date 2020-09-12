// import all the stuff
//import express from "express";
const express = require('express');
const mongoose = require('mongoose');
const CORS = require('cors');
const Pusher = require('pusher');

const Messages = require('./dbmessages');

// app config
const app = express();
const port = process.env.PORT || 9000

const pusher = new Pusher({
    appId: '1071679',
    key: 'f996da49b8f75b5608c4',
    secret: '671f3fad6e651e0a542e',
    cluster: 'ap2',
    encrypted: true
});

// middlewares
app.use(express.json());

app.use(CORS());

//app.use((req, res, next) => {
//    res.setHeader('Access-Control-Allow-Origin', '*');
//    res.setHeader('Access-Control-Allow-Headers', '*');
//    next();
//})
/// database config
mongoose.connect('mongodb+srv://mandar1712:mandar1712@cluster0.mlciu.mongodb.net/wahtsappdb?retryWrites=true&w=majority', {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const db = mongoose.connection

db.once('open', () => {
    console.log('db is connected!');
    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) => {
        console.log(change);
        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted', {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received
            });
        }else {
            console.log('Error triggering Pusher!');
        }
    })
})
//???

// api routers
app.get('/', (req, res) => {
    res.status(200).send('Hello world!');
})

app.post('/message/new', (req, res) => {
    const dbMessage = req.body
    Messages.create(dbMessage, (err, data) => {
        if(err){
            res.status(500).send(err)
        } else {
            res.status(201).send(`new message created: \n ${data}`)
        }
    })
})

app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if(err){
            res.status(500).send(err)
        }else {
            res.status(200).send(data)
        }
    })
})
// listen
app.listen(port, () => console.log(`Listening on localhost: ${port}`));