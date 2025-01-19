import axios from "axios";

// Function to fetch data from GeoServer
const fetchGeoDataFromUrl = async (url, typeName) => {
  try {
    const response = await axios.get(url, {
      params: {
        service: "WFS",
        version: "1.1.0",
        request: "GetFeature",
        typeName,
        outputFormat: "json",
        srsname: "EPSG:3857",
      },
    });

    return response.data.features || []; // Return features array
  } catch (error) {
    console.error(`Error fetching data from ${typeName}:`, error);
    throw error;
  }
};

// Combined fetch function
export const fetchGeoData = async () => {
  try {
    const dataUrl = window.__analytics__.dataUrl;

    const [shadowFeatures, geotaggedFeatures] = await Promise.all([
      fetchGeoDataFromUrl(dataUrl, "js2surveydsws:work_js2project_shadow"), // Shadow works
      fetchGeoDataFromUrl(dataUrl, "js2surveydsws:work_js2project"),       // Geotagged works
    ]);

    // Combine both features into a single array
    const combinedFeatures = [...shadowFeatures, ...geotaggedFeatures];

    return { features: combinedFeatures }; // Return combined features in the same structure
  } catch (error) {
    console.error("Error fetching combined data:", error);
    throw error;
  }
};
