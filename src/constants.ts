// PROJECT_MODULES
import { getEnvVar } from "./utils";

export const API_V1 = getEnvVar("API_V1");

export const BOOTCAMPS_URL = API_V1 + "/bootcamps";
export const COURSES_URL = API_V1 + "/courses";
