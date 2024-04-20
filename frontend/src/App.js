import './App.css';

function App() {
  const [radius, setRadius] = useState(0);
  const [introduction, setIntroduction] = useState("");

  async function QueryUser(e) {
    e.preventDefault();

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
