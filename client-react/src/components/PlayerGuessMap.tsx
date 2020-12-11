import React, { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-bootstrap';
import { RouteProps } from 'react-router-dom';
import markerImage from './../assets/indicator-small.png'

type MapProp = { enablePegman?: boolean, scriptSrc: string, lat: number, lng: number, callback: ( {}: { lat: number; lng: number; } ) => void }
export default React.memo(function GuessMap(props: MapProp, { children, ...rest }: RouteProps) {

  const googleMapRef = useRef(null);

  const markers: google.maps.Marker[] = [];

  function getRandomLatLong(): number {
      return parseFloat((Math.random() * 360 - 180).toFixed(5));
  }

  function onMapClickEvent(ev: google.maps.MouseEvent | google.maps.IconMouseEvent, map: google.maps.Map) {
    console.log('ev', ev);
    
    let marker = new google.maps.Marker({
      position: { lat: ev.latLng.lat(), lng: ev.latLng.lng() },
      map,
      title: 'Guess here',
      icon: markerImage,
      animation: google.maps.Animation.DROP
    });
    markers.pop()?.setMap(null);
    markers.push(marker);
    
  }

  function googleMapsLoaded() {
    const map = new google.maps.Map(
        document.getElementById('google-map') as HTMLElement,
        {
            zoom: 2,
            center: {lat: props.lat, lng: props.lng},
            streetViewControl: props.enablePegman ? true : false       
        }
    )
    google.maps.event.addListener(map.getStreetView(), 'location_changed', (event) => {
      console.log('street ev', map.getStreetView().getLocation().latLng?.lat());
      let marker = new google.maps.Marker({
        position: { lat: map.getStreetView().getLocation().latLng?.lat() || 0, lng: map.getStreetView().getLocation().latLng?.lng() || 0},
        map,
        title: 'Guess here',
        icon: markerImage,
        animation: google.maps.Animation.DROP
      });
      markers.pop()?.setMap(null);
      markers.push(marker);

      props.callback({ lat: map.getStreetView().getLocation().latLng?.lat() || 0, lng: map.getStreetView().getLocation().latLng?.lng() || 0 })
    });
    map.addListener('click', (event) => {
        onMapClickEvent(event, map)
        props.callback({ lat: event.latLng.lat(), lng: event.latLng.lng() })
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
    
  }, [props.scriptSrc])

  return (
      <div style={{ width: '100%', height: '100%' }}>
        <div id="google-map" ref={googleMapRef}></div>
      </div>
  )
})
