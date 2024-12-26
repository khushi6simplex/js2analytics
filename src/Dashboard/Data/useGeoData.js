import axios from 'axios';

// Function to fetch data from GeoServer with a CQL filter
export const fetchGeoData = async () => {
  try {
    const dataUrl = window.__analytics__.dataUrl;
    const response = await axios.get(dataUrl, {
      params: {
        service: 'WFS',
        version: '1.1.0',
        request: 'GetFeature',
        typeName: 'js2surveydsws:work_js2project_shadow',
        outputFormat: 'json',
        srsname: 'EPSG:3857'
      },
    });

    return response.data; // Return the fetched data
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error; // Handle errors appropriately
  }
};
