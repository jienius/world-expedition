import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button } from 'react-bootstrap';
import { RouteProps } from 'react-router-dom';
import markerImage from './../assets/indicator-small.png'
import './PlayerStreetViewMap.css';

import guessImage from './../assets/guessLogo.png'

type MapProp = { enableMovement: boolean, scriptSrc: string, lat: number, lng: number, bottomLeftCallBack: () => void }
export default React.memo(function StreetViewMap(props: MapProp, { children, ...rest }: RouteProps) {

  const googleMapRef = useRef(null);


  function googleMapsLoaded() {
    const map = new google.maps.Map(
        document.getElementById('streetview-map') as HTMLElement,
        {
            zoom: 2,
            center: {lat: props.lat, lng: props.lng},
        }
    )
    const panorama = new google.maps.StreetViewPanorama(
      document.getElementById("streetview-pano") as HTMLElement,
      {
        position: {lat: props.lat, lng: props.lng},
        clickToGo: props.enableMovement,
        disableDefaultUI: true,
        pov: {
          heading: 34,
          pitch: 10,
        },
      }
    );
    map.setStreetView(panorama);

    const controlUI = document.createElement('div');

    assignButton(controlUI);

    panorama.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(
      controlUI
    );

    
  }

  function assignButton(controlDiv: Element) {
    // Set CSS for the control border.
    const controlUI = document.createElement("div");
    controlUI.style.marginBottom = "22px";
    controlUI.title = "Click to guess the map";
    controlDiv.appendChild(controlUI);

    // CREATE IMAGE
    const controlImg = document.createElement('img');
    controlImg.src=guessImage;
    controlImg.className="guess-btn-player-view"
    controlUI.appendChild(controlImg);

    // Set CSS for the control interior.
    const controlText = document.createElement("div");
    controlText.style.backgroundImage = guessImage;
    controlText.style.color = "rgb(25,25,25)";
    controlText.style.fontFamily = "Roboto,Arial,sans-serif";
    controlText.style.fontSize = "16px";
    controlText.style.lineHeight = "38px";
    controlText.style.paddingLeft = "5px";
    controlText.style.paddingRight = "5px";
    controlText.className = ""
    controlText.innerHTML = "Guess!";
    // controlUI.appendChild(controlText);
  
    // Setup the click event listeners: simply set the map to Chicago.
    controlUI.addEventListener("click", () => {
      props.bottomLeftCallBack()
    });
  }

  useEffect(() => {
    let script = document.querySelector(`script[src="${props.scriptSrc}"]`);
    if (!script) {
      // Create script
      const googleMapScript = document.createElement('script');
      // when using https, switch to https
      if (googleMapScript) {
        const url = props.scriptSrc;
        googleMapScript.src=url;
        googleMapScript.async = true;
        googleMapScript.setAttribute("data-status", "loading");
        // Add script to document body
        document.body.appendChild(googleMapScript);

        googleMapScript.addEventListener("load", googleMapsLoaded);
        googleMapScript.addEventListener("error", () => {});
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
        script.removeEventListener("error", () => {});
      }
    };
    
  }, [props.scriptSrc, props.lat, props.lng, props.enableMovement])

  return (
    <div>
        <div style={{ width: '0px', height: '0px' }} id="streetview-map" ref={googleMapRef}></div>
        <div className="streetview-pano" id="streetview-pano" ref={googleMapRef}></div>
    </div>
      
  )
})
