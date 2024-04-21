import React, { useState , useEffect} from 'react';
import axios from 'axios';
import './App.css';
import Slider from './components/Slider/Slider'

function App() {
  const [radius, setRadius] = useState(1);
  const [introduction, setIntroduction] = useState("");
  const [latitude, setLatitude] = useState(0.0);
  const [longitude, setLongitude] = useState(0.0);


  var peerConnection;
  var localStream;
  var remoteStream;

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(function(position) {
        setLatitude(position.coords.latitude);
        console.log("Latitude: " + latitude);
        setLongitude(position.coords.longitude);
        console.log("Longitude: " + longitude);
      }, function(error) {
        console.error("Error Code = " + error.code + " - " + error.message);
      });
    }
    else {
      console.log("Geolocation API is not available in your browser.");
    }
  });

  async function initialize() {
    peerConnection = new RTCPeerConnection();
    localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:true});
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
          'radius': 5,
          'lat': 5,
          'lon': 5,
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
        'radius':5,
        'lat':5,
        'lon':5
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

  async function Add_Answer() {
    /*Add 6's SDP offer to 2's remote stream*/
    console.log('Add answer triggered');

    // need polling 

    // let answer = JSON.parse(document.getElementById('answer-sdp').value)
    // console.log('answer:', answer)
    // if (!peerConnection.currentRemoteDescription){
    //     peerConnection.setRemoteDescription(answer);
    // }
    
    let remote_user = null;
    let message = null;

    /*Get 6's data first from matched dictionary by querying 2:6*/
    axios.post('http://localhost:8080/check_for_matched', {
      'info': introduction,
      'radius': 5,
      'lat': 5,
      'lon': 5
    }).then(async res => {
      message = res.data['message'];
      remote_user = {
        'info' : message['intro'],
        'radius' : message['radius'],
        'lat' : message['lat'],
        'lon' : message['lon']
      }

      console.log("Remote user: ", remote_user);
      
      /*Remove 2 from waiting list */
      axios.post('http://localhost:8080/remove_waitlist', 
        {'info': introduction, 'radius' : 5, 'lat': 5, 'lon': 5}).then(res => {
          console.log(res.data['message']);
        });

      /*Remove 2 from to_be_matched */
      axios.post('http://localhost:8080/remove_to_be_matched', 
        {
          'info':introduction,
          'radius':5,
          'lat':5,
          'lon':5
        }).then(res => {
          console.log(res.data);
        });

      /*add 6:2 -> signifies to client 1 that client 2 has agreed*/
      axios.post('http://localhost:8080/add_matched',
        {
          'key' : remote_user,
          'value' : {
            'info': introduction,
            'radius' : 5,
            'lat' : 5,
            'lon' : 5
          }
        }
      ).then(res => {
        console.log(res.data);
      });

      /*then remove 2:6*/
      axios.post('http://localhost:8080/remove_matched',
        {
          'key' : {
            'info': introduction,
            'radius' : 5,
            'lat' : 5,
            'lon' : 5
          },
          'value' : remote_user
        }
      ).then(res => {
        console.log(res.data);
      });


        console.log(res.data);
      });
  }

  function handleIntroInput(e) {
    setIntroduction(e.target.value)
  };

  async function QueryUser(e) {
    e.preventDefault();
    Radius_Match();
  }

  return (
    <div className="App">
      <h2>Friend.me</h2>

      {/*Maybe make a componenet for the videos*/}
      <div id = "videos">
        <video className="video-player" id="user-1" autoPlay playsInline></video>
        <video className="video-player" id="user-2" autoPlay playsInline></video>
      </div>

      <label htmlFor="userInput" id = "intro_input_label">Tell us a little bit about yourself: </label>

      <div id = "userInput">
        <input type="text" name="userInput" placeholder="Type your introduction" value = {introduction} onChange = {handleIntroInput}/>
      </div>
      
      <div id = "radiusInput">
        <label htmlFor="radiusInput">Specify the radius using the below slider: </label>
      </div>
      
      <div id = "slider">
        <Slider radius = {radius} setRadius = {setRadius}/>
      </div>
      
      <div id = "submitButton">
        <SubmitButton title="Find Someone!" onClick={QueryUser}/>
        <SubmitButton title = "test" onClick = {Add_Answer}/>
      </div>
      
    </div>
  );
}

function SubmitButton({title, onClick}) {
  return (
    <button onClick={onClick}> {title} </button>
  )
}

export default App;
