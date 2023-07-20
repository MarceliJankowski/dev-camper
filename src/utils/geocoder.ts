// PACKAGES
import NodeGeocoder, { Providers } from "node-geocoder";

// MODULES
import { getEnvVar } from "./getEnvVar";

const options = {
  provider: getEnvVar("GEOCODER_PROVIDER") as Providers,
  apiKey: getEnvVar("GEOCODER_API_KEY"),
  formatter: null,
};

export const geocoder = NodeGeocoder(options);
