// PACKAGES
import NodeGeocoder from "node-geocoder";

// PROJECT_MODULES
import getEnvVar from "./getEnvVar";

const options = {
  provider: getEnvVar("GEOCODER_PROVIDER"),
  apiKey: getEnvVar("GEOCODER_API_KEY"),
  httpAdapter: "https",
  formatter: null,
};

const geocoder = NodeGeocoder(options as any);

export default geocoder;
