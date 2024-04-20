const express = require('express');
const app = express();
const PORT = 8080;


const waitlist = [];
const matched =  new Map();
const to_be_matched = new Set();

app.use( express.json() )

app.get('/tshirt', (req,res) =>{
    res.status(200).send({
        tshirt: 'testing tesitng',
        size: 'large'
    })
});

app.post('/tshirt/:id', (req, res) => {
    const { id } = req.params;
    const { logo } = req.body;
    const { test_var } = req.body;

    if (!logo) {
        res.status(418).send({message: "We need a logo!"})
    }

    res.send({
        tshirt: `shirt with your ${logo} and ID of ${id} and test_var of ${test_var}`,
    })
});

app.post('/add_to_waitlist', (req, res) => {
  const {offer} = req.body;
  const {radius} = req.body;
  const {lat} = req.body;
  const {lon} = req.body;
  const {intro} = req.body;

  const client = new Client_Object(intro, radius, lon, lat, null, offer)
  if(!radius) {
    res.status(418).send({message: "We need a radius"})
  }
  if(!lon || !lat){
    res.status(418).send({message: "We need a location"})
  }
  if(!offer) {
    res.status(418).send({message: "We need a offer"})
  }

  curr = waitlist.next;

  while(curr.next.val != waitlist.val){
    curr = curr.next;
  }

  new_node = new Node(curr.next, curr, client);
  curr.next = new_node;
  new_node.next.prev(new_node);

  res.status(200).send({
    message: 'client added successfully to waitlist'
  })
})

app.post('/add_matched', (req, res) => {
    const{key} = req.body;
    const{value} = req.body;
    matched.set(key, value);
    to_be_matched.delete(key); //move this to 2_poll/when 2 finds 2:6, as like the last thing in that sequence

    res.status(200).send({
        message: "added key value pair successfully to matched"
    })
})

app.post('/remove_matched', (req, res) => {
    const{key} = req.body;
    matched.delete(key);

    res.status(200).send({
        message: "removed key value pair successfully from matched"
    })
})

app.post('/remove_waitlist', (req, res) => {
  const {offer} = req.body;
  const {radius} = req.body;
  const {lat} = req.body;
  const {lon} = req.body;
  const {intro} = req.body;

  const client = new Client_Object(intro, radius, lon, lat, null, offer)

  if(!radius) {
    res.status(418).send({message: "We need a radius"})
  }
  if(!lon || !lat){
    res.status(418).send({message: "We need a location"})
  }
  if(!offer) {
    res.status(418).send({message: "We need a offer"})
  }

  curr = waitlist;
  curr = curr.next;
  while (curr.val != waitlist && curr.val != client) {
    curr = curr.next;
  }
  if (!curr.val.intro){
    res.status(418).send({message: "Client object not found in WL"})
  }
  curr.prev.next = curr.next;
  curr.next.prev = curr.prev;
  res.status(200).send({message: "Client object successfully removed from WL"})

})



app.listen(PORT)
