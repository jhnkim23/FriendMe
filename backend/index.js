var Client = require('./classes/Client');
var List_Node = require('./classes/List_Node');
var hash = require('object-hash');

const express = require('express');
const app = express();
const PORT = 8080;

app.use( express.json() )
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    next();
  })

app.listen(
    PORT,
    () => console.log(`it's alive on http://localhost:${PORT}`)
);

// DUMMY HEAD AND DUMMY TAIL
let waitlist = new List_Node(null, null, null);
let tail = waitlist.next = new List_Node(waitlist, null, null);

// Data structures useful for radius-match
let waitlist_ind = {};
let matched = {};
let to_be_matched = new Set();

// Store answer/offer for each client
// Client -> [offer, answer]
let SDP = {};

// Store icecandidates for each client
// Client -> [iceCandidate0, iceCandidate1, ...]
let ice_candidates = {};

function ClientFromData(info) {
    const userData = info;
    const introduction = userData['info'];
    const radius = userData['radius'];
    const lon = userData['lon'];
    const lat = userData['lat'];
    const user = new Client(introduction, radius, lon, lat);

    return user;
}

app.post('/check_for_matched', (req, res) => {
    const user = ClientFromData(req.body);
    console.log(hash(user));
    console.log(user);
    if (hash(user) in matched) {
        const userToSend = matched[hash(user)];
        console.log(userToSend);
        //console.log(SDP[hash(userToSend)]);
        res.send({
            message:
            {
                'client' : {
                    'info' : userToSend.info,
                    'radius' : userToSend.radius,
                    'lon' : userToSend.lon,
                    'lat' : userToSend.lat,
                },
                'SDP' : [SDP[hash(userToSend)][0], SDP[hash(userToSend)][1]],
            }
        });
    }

    else {
        res.send({
            message: 'Not Found'
        });
    }
});

app.post('/radius_match', (req, res) => {
    const user = ClientFromData(req.body);
    
    // either we get the last node we haven't checked yet, or the dummy head's next
    var traverse = (hash(user) in waitlist_ind) ? waitlist_ind[hash(user)].next : waitlist.next;
    
    // make sure we aren't at the end of the list
    if (traverse != tail) {
        const checkWith = traverse.client;
        waitlist_ind[hash(user)] = traverse;

        const distBetween = DistanceBetween(user.lat, user.lon, checkWith.lat, checkWith.lon);
        
        if (!(hash(checkWith) in to_be_matched) && distBetween <= user.radius && distBetween <= checkWith.radius) {
            to_be_matched.add(hash(checkWith));
            res.send({
                message: {
                    'client' : checkWith,
                    'SDP' : SDP[hash(checkWith)], // [offer, answer] -> [offer, null]
                    'iceCandidates': ice_candidates[hash(checkWith)]
                }
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
        delete waitlist_ind[hash(user)];
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

app.post('/add_to_waitlist', (req, res) => {
    const data = req.body;
    const user = ClientFromData(data['client']);
    const SDP_data = data['SDP'];

    if(user.radius <= 0) {
      res.status(418).send({message: "We need a radius"});
    }
    if(user.lon == null || user.lat == null){
      res.status(418).send({message: "We need a location"});
    }
    if(SDP_data[0] == null) {
      res.status(418).send({message: "We need a offer"});
    }
    
    SDP[hash(user)] = SDP_data;

    new_node = new List_Node(tail.prev, tail, user);
    tail.prev.next = new_node;
    tail.prev = new_node;

    res.status(200).send({
      message: 'client added successfully to waitlist'
    });
});

app.post('/remove_waitlist', (req, res) => {
    const user = ClientFromData(req.body);

    if (user.radius == null) {
        res.status(416).send({message: "We need a radius"});
    }
    if(user.lon == null || user.lat == null){
        res.status(418).send({message: "We need a location"});
    }

    if (hash(user) in waitlist_ind) {
        user_to_remove = waitlist_ind[hash(user)]; //ListNode
        user_to_remove.prev.next = user_to_remove.next;
        user_to_remove.next.prev = user_to_remove.prev;
        
        let curr = waitlist.next;
        
        while(curr.client != null){
            console.log(curr.client);
        }
        
        res.status(200).send({
            message: "Client object successfully removed from WL"
        });
    }

    else {
        console.log(user);
        console.log(waitlist_ind);
        console.log(hash(user));
        res.status(400).send({
            message: 'No matched user associated with given user to remove'
        });
    }
});
  
app.post('/add_matched', (req, res) => {
    const data = req.body;
    const key = ClientFromData(data['key']);
    const value = ClientFromData(data['value']);

    matched[hash(key)] = value;
    // console.log(matched);
    // console.log(key);
    //to_be_matched.delete(hash(key)); //move this to 2_poll/when 2 finds 2:6, as like the last thing in that sequence

    // console.log("check")
    // console.log(matched);
    res.status(200).send({
        message: "added key value pair successfully to matched"
    });
});

app.post('/remove_matched', (req, res) => {
    const user = ClientFromData(req.body);
    delete matched[hash(user)];


    //console.log(matched);
    res.status(200).send({
        message: "removed key value pair successfully from matched"
    });
});

app.post('/remove_to_be_matched', (req, res) => {
    console.log("tbm1");
    console.log(to_be_matched);

    const user = ClientFromData(req.body);

    console.log(user);

    to_be_matched.delete(hash(user));

    console.log("tbm2");
    console.log(to_be_matched);
    res.status(200).send({
        message: "removed key successfully from to_be_matched"
    });
});

app.post('/add_SDP', (req, res) => {
    const data = req.body;
    const user = ClientFromData(data['client']);
    const add_SDP = data['SDP'];
    
    console.log("ADDING TO SDP");
    console.log(user);
    console.log(hash(user));

    SDP[hash(user)] = add_SDP;
    //console.log(SDP);
    res.status(200).send({
        message: "added key value pair successfully to SDP"
    });
});

app.post('/remove_SDP', (req, res) => {
    const user = ClientFromData(req.body);
    delete SDP[hash(user)];

    //console.log(SDP);

    res.status(200).send({
        message: "removed key value pair successfully from SDP"
    });
});

app.post('/add_ice_candidate', (req, res) => {
    const data = req.body;
    const user = ClientFromData(data['client']);
    const ice_candidate = data['iceCandidate'];

    console.log(data);

    if (hash(user) in ice_candidates)
        ice_candidates[hash(user)].push(ice_candidate);
    else
        ice_candidates[hash(user)] = [ice_candidate];

    res.status(200).send({
        message: "added ice candidate successfully to ice_candidates"
    });
});