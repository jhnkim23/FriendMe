import ReactSlider from "react-slider";
import './Slider.css'

function Slider({radius, setRadius}) {    
    return (
        <>
            <label for="radiusInput">Specify the radius using the below slider: </label>

            <ReactSlider
                className="customSlider"
                trackClassName="customSlider-track"
                thumbClassName="customSlider-thumb"
                markClassName='customSlider-mark'
                marks = {5}
                min = {0}
                max = {50}
                defaultValue = {0}
                value = {radius}
                onChange={(value) => {
                    setRadius(value);
                }}
                renderThumb = {(props, state) => <div {...props}>{state.value}</div>}
                renderMark = {(props) => {
                    if (props.key < radius) {
                    props.className = "customSlider-mark customSlider-mark-before";
                    } else if (props.key === radius) {
                    props.className = "customSlider-mark customSlider-mark-active";
                    }
                    return <span {...props} />;
                }}
            />

        </>
        
        
    );
    
};

export default Slider;