import React, { useEffect, useRef } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat } from "ol/proj";
import { defaults as defaultControls } from "ol/control";

const FloatingMap = React.forwardRef((_, ref) => {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
  
    useEffect(() => {
      if (!mapInstance.current && mapRef.current) {
        mapInstance.current = new Map({
          target: mapRef.current,
          layers: [
            new TileLayer({
              source: new OSM(),
            }),
          ],
          view: new View({
            center: fromLonLat([75.7139, 19.7515]),
            zoom: 6,
          }),
          controls: defaultControls(),
        });
  
        if (ref) {
          ref.current = mapInstance.current;
        }
      }
    }, [ref]);
  
    return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
  });
  

FloatingMap.displayName = "FloatingMap";

export default FloatingMap;
