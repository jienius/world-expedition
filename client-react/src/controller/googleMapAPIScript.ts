const googleMapScript = document.createElement('script');
// when using https, switch to https
const MapsAPIURL = `http://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_maps_k}&libraries=places`

export default MapsAPIURL;