import { fromLonLat } from "ol/proj";

export const panToLocation = (map, coordinates) => {
  if (map && coordinates) {
    const transformedCoordinates = fromLonLat(coordinates);
    const view = map.getView();
    if (view) {
      view.animate({
        center: transformedCoordinates,
        duration: 1000,
      });
      console.log("Panning to:", transformedCoordinates);
    } else {
      console.error("Map view is not available");
    }
  } else {
    console.error("Map or coordinates are not defined");
  }
};
