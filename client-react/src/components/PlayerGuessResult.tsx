import React, { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-bootstrap';
import { RouteProps } from 'react-router-dom';
import './PlayerGuessResult.css';
import indicator from './../assets/indicator-small.png'

type MapProp = { scriptSrc: string, actualVSGuessedLatLng: { guessedLatLng: { lat: number, lng: number }, actualLatLng: { lat: number, lng: number }, username: string }[] }
export default React.memo(function PlayerGuessResultMap(props: MapProp, { children, ...rest }: RouteProps) {

  const googleMapRef = useRef<HTMLDivElement>(null);

  const markers: google.maps.Marker[] = [];

  function googleMapsLoaded() {
    if (googleMapRef.current) {
      const map = new google.maps.Map(
        googleMapRef.current,
        {
          zoom: 1,
          center: { lat: 0, lng: 0 },
          clickableIcons: false,
          disableDefaultUI: true,
        }
      )
      const markerImage = indicator

      for (const pairOfActualVSGuessed of props.actualVSGuessedLatLng) {
        const lineCoordinates = [
          {
            lat: pairOfActualVSGuessed.guessedLatLng.lat,
            lng: pairOfActualVSGuessed.guessedLatLng.lng
          },
          {
            lat: pairOfActualVSGuessed.actualLatLng.lat,
            lng: pairOfActualVSGuessed.actualLatLng.lng
          }
        ]
        const theLine = new google.maps.Polyline({
          path: lineCoordinates,
          geodesic: true,
          strokeColor: "#FF0000",
          strokeOpacity: 1.0,
          strokeWeight: 2,
          draggable: false,
          editable: false
        });
        theLine.setMap(map);
        // const distance = google.maps.geometry.spherical.computeLength(theLine.getPath()) // we have no js library for this for now
        const distance = 'xxx'
        let guessedMarker = new google.maps.Marker({
          position: { lat: pairOfActualVSGuessed.guessedLatLng.lat, lng: pairOfActualVSGuessed.guessedLatLng.lng },
          map,
          title: `${pairOfActualVSGuessed.username} \'s guess`,
          icon: markerImage,
          animation: google.maps.Animation.DROP
        });

        let actualMarker = new google.maps.Marker({
          position: { lat: pairOfActualVSGuessed.actualLatLng.lat, lng: pairOfActualVSGuessed.actualLatLng.lng },
          map,
          title: `Actual Marker`,
          // icon: markerImage,
          animation: google.maps.Animation.DROP
        });
      }
    }
  }

  useEffect(() => {
    let script = document.querySelector(`script[src="${props.scriptSrc}"]`);
    if (!script) {
      // Create script
      const googleMapScript = document.createElement('script');
      // when using https, switch to https
      if (googleMapScript) {
        const url = props.scriptSrc;
        googleMapScript.src = url;
        googleMapScript.async = true;
        googleMapScript.setAttribute("data-status", "loading");
        // Add script to document body
        document.body.appendChild(googleMapScript);

        googleMapScript.addEventListener("load", googleMapsLoaded);
        googleMapScript.addEventListener("error", () => { });
      }

    } else {
      googleMapsLoaded()
      // script.addEventListener("load", googleMapsLoaded);
      // script.addEventListener("error", () => {});
    }



    // Remove event listeners on cleanup
    return () => {
      if (script) {
        script.removeEventListener("load", googleMapsLoaded);
        script.removeEventListener("error", () => { });
      }
    };

  }, [props.scriptSrc, googleMapRef])

  return (
    <div className='player-map-result-div'>
      <div id="google-map" ref={googleMapRef}></div>
    </div>
  )
})
