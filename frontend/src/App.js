import { useState } from 'react';
import './App.css';
import Slider from './components/Slider/Slider'

function App() {
  const [radius, setRadius] = useState(0);
  const [introduction, setIntroduction] = useState("");
  const [latitude, setLatitude] = useState(0.0);
  const [longitude, setLongitude] = useState(0.0);
  
  function handleIntroInput(e) {
    setIntroduction(e.target.value)
  }

  async function QueryUser(e) {
    e.preventDefault();

    console.log("User Introduction:", introduction);
    /* Now that we have intro, radius, lat/long states, we need to send this info using a await fetch call to the server */
  }

  return (
    <div className="App">
      <h2>Friend.me</h2>

      <div id = "videos">
        <video class="video-player" id="user-1" autoplay playsinline></video>
        <video class="video-player" id="user-2" autoplay playsinline></video>
      </div>

      <label for="userInput">Tell us a little bit about yourself: </label>
      <input type="text" id="userInput" name="userInput" placeholder="Type your introduction" value = {introduction} onChange = {handleIntroInput}/>

      <Slider radius = {radius} setRadius = {setRadius}/>

      <SubmitButton title="Find" onClick={QueryUser}/>

      {/*Also need some geolocation state as well to get lat and longitude right? */}
    </div>
  );
}

function SubmitButton({title, onClick}) {
    return (
      <button onClick={onClick}> {title} </button>
    )
};

export default App;
