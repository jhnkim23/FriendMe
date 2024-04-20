import { useState, useEffect } from 'react';
import './App.css';
import Slider from './components/Slider/Slider'

function App() {
  const [radius, setRadius] = useState(0);
  const [introduction, setIntroduction] = useState("");
  const [latitude, setLatitude] = useState(0.0);
  const [longitude, setLongitude] = useState(0.0);
  
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

  function handleIntroInput(e) {
    setIntroduction(e.target.value)
  };

  async function QueryUser(e) {
    e.preventDefault();
    /* Now that we have intro, radius, lat/long states, we need to send this info using a await fetch call to the server */

    
  };

  return (
    <div className="App">
      <h2>Friend.me</h2>

      {/*Maybe make a componenet for the videos*/}
      <div id = "videos">
        <video className="video-player" id="user-1" autoPlay playsInline></video>
        <video className="video-player" id="user-2" autoPlay playsInline></video>
      </div>

      <label htmlFor="userInput">Tell us a little bit about yourself: </label>
      <input type="text" id="userInput" name="userInput" placeholder="Type your introduction" value = {introduction} onChange = {handleIntroInput}/>

      <Slider radius = {radius} setRadius = {setRadius}/>

      <SubmitButton title="Find" onClick={QueryUser}/>

    </div>
  );
};

function SubmitButton({title, onClick}) {
    return (
      <button onClick={onClick}> {title} </button>
    )
};

export default App;
