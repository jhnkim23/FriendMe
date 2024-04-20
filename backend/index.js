const express = require('express');
const app = express();
const PORT = 8080;


app.use( express.json() )


app.listen(PORT)
app.listen(
    PORT,
    () => console.log(`it's alive on http://localhost:${PORT}`)
)

// UPDATE THIS TO HAVE PROPER TAIL AND DUMMY HEAD POINTERS
// AFTER INTEGRATING CLASSES
let waitlist = ListNode();
let tail = ListNode();

// Data structures useful for radius-match
let checkedInWaitlist = {};
let to_be_matched = new Set();

let matched = {};

function ClientFromData(info) {
    const userData = info.body;
    const introduction = userData['info'];
    const radius = userData['radius'];
    const lon = userData['lon'];
    const lat = userData['lat'];
    const answer = userData['answer'];
    const offer = userData['offer'];
    const user = new Client(introduction, radius, lon, lat, answer, offer);

    return user;
}

app.post('/check-for-matched', (req, res) => {
    const user = ClientFromData(req);

    if (user in matched) {
        const userToSend = matched[user];
        res.send({
            message:    
            {
                'introduction' : userToSend.info,
                'radius' : userToSend.radius,
                'lon' : userToSend.lon,
                'lat' : userToSend.lat,
                'answer' : userToSend.answer,
                'offer' : userToSend.offer
            }
        })
    }

    else {
        res.send({
            message: 'Not Found'
        })
    }
});

app.post('/radius-match', (req, res) => {
    const user = ClientFromData(req);
    
    // either we get the last node we haven't checked yet, or the dummy head's next
    var traverse = (user in checkedInWaitlist) ? checkedInWaitlist[user].next : waitlist.next;
    
    // make sure we aren't at the end of the list
    if (traverse != tail) {
        const checkWith = traverse.client;
        checkedInWaitlist[user] = traverse;

        const distBetween = DistanceBetween(user.lat, user.lon, checkWith.lat, checkWith.lon);
        
        if (!(checkWith in to_be_matched) && distBetween <= user.radius && distBetween <= checkWith.radius) {
            to_be_matched.add(checkWith);
            res.send({
                message: checkWith
            });
        }
        
        else {
            res.send({
                message: 'Continue'
            });
        }
    }

    // if (traverse == tail) {
    else {
        res.send({
            message: 'EOL'
        });
    }
});

function DistanceBetween(lat1,lon1,lat2,lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lon2-lon1); 
    var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; // Distance in km
    return d;
}
  
function deg2rad(deg) {
    return deg * (Math.PI/180)
}

/*
Check person: (radius, lat, long)
Person Data inside WL: (radius, lat, long, offer)

add to WL(radius, lat, long, offer):
remove from WL():

*/


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