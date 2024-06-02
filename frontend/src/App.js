import React, { useState , useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  // const [radius, setRadius] = useState(1);
  // const [introduction, setIntroduction] = useState("");
  // console.log(radius);
  // console.log(introduction);
  var radius = 1;
  var introduction = "";
  var peerConnection;
  var localStream;
  var remoteStream;

  useEffect(() => {
    initialize();
  }, []);

  async function initialize() {
    const configuration = {'iceServers' : [{'urls': 'stun:stun.l.google.com:19302'}]}
    peerConnection = new RTCPeerConnection(configuration);
    localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:true});
    remoteStream = new MediaStream();

    var video1 = document.getElementById('user1');
    var video2 = document.getElementById('user2');

    video1.srcObject = localStream;
    video2.srcObject = remoteStream;

    localStream.getTracks().forEach(async (track) => {
        await peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          remoteStream.addTrack(track);
        });
    };

    peerConnection.addEventListener('connectionstatechange', e => {
      if (peerConnection.connectionState === 'connected') {
        console.log('connected');
      }
    });
  }

  async function Create_Offer() {
    peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        axios.post('http://localhost:8080/add_ice_candidate',
          {
            'client':
            {
              'info': introduction,
              'radius': radius,
              'lat': 10,
              'lon': 10
            },
            'iceCandidate': event.candidate
          }).then(res => {
            console.log(res.data)
          });
      }
    }
    const offer = await peerConnection.createOffer({ iceRestart: true});
    await peerConnection.setLocalDescription(offer);
  }

  async function Create_Answer(offer, iceCandidates){
    peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        axios.post('http://localhost:8080/add_ice_candidate',
          {
            'client':
            {
              'info': introduction,
              'radius': radius,
              'lat': 10,
              'lon': 10
            },
            'iceCandidate': event.candidate
          }).then(res => {
            console.log(res.data)
          });
      }
    }

    offer = JSON.parse(offer);
    await peerConnection.setRemoteDescription(offer);

    for (var i = 0; i < iceCandidates.length; i++)
      await peerConnection.addIceCandidate(iceCandidates[i]);

    let answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    //This might be better if the method was like split in two
    let SDP = [null, JSON.stringify(peerConnection.localDescription)];
    
    console.log("answer", SDP)
    console.log("p2p localstreams", peerConnection.getLocalStreams());
    console.log("p2p remotestreams", peerConnection.getRemoteStreams());
    console.log("localstream", localStream);
    console.log("remotestream", remoteStream);


    await axios.post('http://localhost:8080/add_SDP',
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
      let message = res['message'];
      
      console.log("check");
      console.log(key);
      
      if (message =="added key value pair successfully to matched"){
        Check_If_Matched(false);
      }
      else{
        console.log(message)
        console.log("something in the backend is broken I think, or the key value params you're passing are wrong")
      }
    });

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
          'SDP' : SDP,
        }).then(res => {
          console.log(res.data);
          Check_If_Matched(true);
    });
  }

  async function Radius_Match() {
    console.log(introduction);
    console.log(radius);
    axios.post('http://localhost:8080/radius_match', 
      {
        'info':introduction,
        'radius':radius,
        'lat':10,
        'lon':10
      }).then(async res => {
        res = res.data;
        let message = res['message'];
        if (message == 'Continue')
          Radius_Match();
        else if (message == 'EOL')
          Add_To_Waitlist();
        else {
          console.log('match');
          let offer = message['SDP'][0];
          let iceCandidates = message['iceCandidates'];

          await Create_Answer(offer, iceCandidates);
          console.log(message);
          console.log(introduction);
          Add_To_Matched(message['client'], 
          {
            'info': introduction,
            'radius': radius,
            'lat': 10,
            'lon': 10
          })
        }
    });
  }

  async function Add_Answer(answer, answer_from, iceCandidates) {
    answer = JSON.parse(answer);
    await peerConnection.setRemoteDescription(answer);
    console.log(iceCandidates)

    for (var i = 0; i < iceCandidates.length; i++)
      await peerConnection.addIceCandidate(iceCandidates[i]);

    console.log('Add answer triggered');
    //Add 6's SDP offer to 2's remote stream
    //let SDP = [JSON.stringify(peerConnection.localDescription), null];

    // need polling 

    // let answer = JSON.parse(document.getElementById('answer-sdp').value)
    // console.log('answer:', answer)
    // if (!peerConnection.currentRemoteDescription){
    //     peerConnection.setRemoteDescription(answer);
    // }

    //let remote_user = null
    let remote_user = answer_from;
    //Get 6's data first from matched dictionary by querying 2:6


      //Remove 2 from waiting list
    axios.post('http://localhost:8080/remove_waitlist', 
    remote_user).then(res => {
      console.log(res.data['message']);
    });

    //Remove 2 from to_be_matched
    axios.post('http://localhost:8080/remove_to_be_matched', 
      {
        'info':introduction,
        'radius':radius,
        'lat':10,
        'lon':10,
      }).then(res => {
        console.log(res.data);
      });

    //add 6:2 -> signifies to client 1 that client 2 has agreed
    axios.post('http://localhost:8080/add_matched',
      {
        'key' : remote_user,
        'value' : {
          'info':introduction,
          'radius':radius,
          'lat':10,
          'lon':10,
        }
      }
    ).then(res => {
      console.log(res.data);
    });

    //then remove 2:6
    axios.post('http://localhost:8080/remove_matched',
      {
        'key' : {
          'info': introduction,
          'radius' : radius,
          'lat' : 10,
          'lon' : 10
        },
        'value' : remote_user
      }
    ).then(res => {
      console.log(res.data);
    });
  }

  async function Check_If_Matched(sender) {
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
      setTimeout(function() {Check_If_Matched(sender);}, 1000);
    }
    else {
      console.log('STOP POLLING' + sender);
      let answer_from = poll_response['message']['client']
      if (sender) {
        console.log(answer_from);
        let answer = poll_response['message']['SDP'][1];
        console.log(answer);

        let iceCandidates = poll_response['message']['iceCandidates'];

        await Add_Answer(answer, answer_from, iceCandidates);
        console.log(peerConnection.remoteDescription);
        console.log(peerConnection.localDescription);
        
        console.log(peerConnection.getLocalStreams());
        console.log(peerConnection.getRemoteStreams());
        console.log(localStream);
        console.log(remoteStream);
      }
      else {
        axios.post("http://localhost:8080/remove_SDP", answer_from);
        axios.post("http://localhost:8080/remove_SDP", 
        {
          'info': introduction,
          'radius': radius,
          'lat': 10,
          'lon': 10,
        });
        axios.post("http://localhost:8080/remove_ice_candidates", answer_from);
        axios.post("http://localhost:8080/remove_ice_candidates", 
        {
          'info': introduction,
          'radius': radius,
          'lat': 10,
          'lon': 10
        });
      }
    }
  }


  async function QueryUser(e) {
    e.preventDefault();
    await Radius_Match();
  }


  function QueryUserTesting(e){
    e.preventDefault();
    introduction = 'test2'
    radius = 5;
    Radius_Match();
  }

  return (
    <>
      <div className="PeerConnection">
        <SubmitButton title="find" onClick={QueryUser}/>
        <SubmitButton title="find2" onClick={QueryUserTesting}/>
        <SubmitButton title="test" onClick={Add_Answer}/>
      </div>
      <div className="VideoPlayers">
        <video className="video-player" id="user1" autoPlay muted playsInline></video>
        <video className="video-player" id="user2" autoPlay muted playsInline></video>
      </div>
    </>
  );
}

function SubmitButton({title, onClick}) {
  return (
    <button onClick={onClick}> {title} </button>
  )
}

// function VideoPlayer({ref, id}) {
//   return (
//     <video ref={ref} class="video-player" id={id} autoplay playsinline></video>
//   )
// }

export default App;
