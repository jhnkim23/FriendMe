import React, { useState , useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [radius, setRadius] = useState(1);
  const [introduction, setIntroduction] = useState("");
  var peerConnection;
  var localStream;
  var remoteStream;

  useEffect(() => {
    initialize();
    console.log(peerConnection, localStream, remoteStream)
  }, []);

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

  async function Check_If_Matched() {
    let poll_response;
    await axios.post('http://localhost:8080/check_for_matched',
      {
        'info':introduction,
        'radius':radius,
        'lat':10,
        'lon':10,
      }).then(res => {
        poll_response = res.data;
    });
    
    if (poll_response['message'] == 'Not Found') {
      console.log('not found');
      setTimeout(Check_If_Matched, 1000);
    }
    else {
      console.log('matched');
    }
  }

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
          Check_If_Matched();
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
        }
    });
  }

  async function QueryUser(e) {
    e.preventDefault();
    Radius_Match();
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
