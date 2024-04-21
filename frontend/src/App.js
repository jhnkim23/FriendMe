import React, { useState , useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [radius, setRadius] = useState(1);
  const [introduction, setIntroduction] = useState("");
  var peerConnection;
  var localStream;
  var remoteStream;

  async function initialize() {
    peerConnection = new RTCPeerConnection();
    localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false});
    remoteStream = new MediaStream();

    // document.getElementById('user-1').srcObject = localStream;
    // document.getElementById('user-2').srcObject = remoteStream;

    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
        });
    };
  }

  async function Create_Offer() {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
  }

  async function Create_Answer(offer){
    offer = JSON.parse(offer)
    await peerConnection.setRemoteDescription(offer);
    let answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    //This might be better if the method was like split in two
    let SDP = [null, JSON.stringify(peerConnection.localDescription)];
    console.log("answer")
    console.log(SDP)
    axios.post('http://localhost:8080/add_SDP',
    {
      'client':
      {
        'info': introduction,
        'radius': radius,
        'lat': 10,
        'lon': 10
      },
      'SDP': SDP
    }).then(res => {
      console.log(res.data)
    });
  }

  async function Add_To_Matched(key, value) {
    axios.post('http://localhost:8080/add_matched',{
      'key': key,
      'value': value
    }).then(res => {
      res = res.data;
      let message = res['message']
      console.log("check")
      if (message =="added key value pair successfully to matched"){
        console.log("poll")
      }
      else{
        console.log(message)
        console.log("something in the backend is broken I think, or the key value params you're passing are wrong")
      }
    });

  }

  useEffect(() => {
    initialize();
    console.log(peerConnection, localStream, remoteStream)
  }, []);

  async function Add_To_Waitlist() {
    await Create_Offer();
    let SDP = [JSON.stringify(peerConnection.localDescription), null];
    console.log(SDP);
    axios.post('http://localhost:8080/add_to_waitlist',
        {
          'client' :
          {
          'info':introduction,
          'radius':radius,
          'lat':10,
          'lon':10,
          },
          'SDP' : SDP
        }).then(res => {
          console.log(res.data);
    });
  }

  async function Radius_Match() {
    axios.post('http://localhost:8080/radius_match', 
      {
        'info':introduction,
        'radius':radius,
        'lat':10,
        'lon':10
      }).then(res => {
        res = res.data;
        let message = res['message'];
        if (message == 'Continue')
          Radius_Match();
        else if (message == 'EOL')
          Add_To_Waitlist();
        else {
          console.log('match');
          let offer = message['SDP'][0]
          console.log(offer)
          Create_Answer(offer);
          Add_To_Matched(message['client'], {
            'info': introduction,
            'radius': radius,
            'lat': 10,
            'lon': 10
          })
        }
    });
  }

  async function Radius_Match_Test() {
    axios.post('http://localhost:8080/radius_match', 
      {
        'info':"Test info",
        'radius':2,
        'lat':10,
        'lon':10
      }).then(res => {
        res = res.data;
        let message = res['message'];
        if (message == 'Continue')
          Radius_Match();
        else if (message == 'EOL')
          Add_To_Waitlist();
        else {
          console.log('match');
          let offer = message['SDP'][0]
          //console.log(offer)
          Create_Answer(offer);
          Add_To_Matched(message['client'], {
            'info': "Test info",
            'radius': 2,
            'lat': 10,
            'lon': 10
          })
        }
    });
  }

  async function QueryUser(e) {
    e.preventDefault();
    await Radius_Match();
    Radius_Match_Test();
  }
  async function QueryUserTesting(e){
    e.preventDefault();
    await Radius_Match_Test();
  }
  return (
    <div className="App">
      <SubmitButton title="find" onClick={QueryUser}/>
    </div>
  );
}

function SubmitButton({title, onClick}) {
return (
  <button onClick={onClick}> {title} </button>
)
}

export default App;
