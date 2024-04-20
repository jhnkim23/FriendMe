const app = require('express')();
const PORT = 8080;

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

app.post('/check-for-matched', (req, res) => {
    const userData = req.body;
    const introduction = userData['info'];
    const radius = userData['radius'];
    const lon = userData['lon'];
    const lat = userData['lat'];
    const answer = userData['answer'];
    const offer = userData['offer'];
    const user = new Client(introduction, radius, lon, lat, answer, offer);

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
    const userData = req.body;
    const introduction = userData['info'];
    const radius = userData['radius'];
    const lon = userData['lon'];
    const lat = userData['lat'];
    const answer = userData['answer'];
    const offer = userData['offer'];
    const user = new Client(introduction, radius, lon, lat, answer, offer);
    
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