class Client {
    constructor(intro, radius, lon, lat) {
        this.info = intro;
        this.radius = radius;
        this.lon = lon;
        this.lat = lat; 
    }
    to_string(){
        return `info: ${this.intro}, radius: ${this.radius}, lon: ${this.lon}, lat: ${this.lat}`;
    }
}

module.exports = Client;