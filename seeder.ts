// PACKAGES
import fs from "fs";
import mongoose from "mongoose";

// MODULES
import Bootcamp from "./src/models/bootcampModel";
import Course from "./src/models/courseModel";
import { getEnvVar } from "./src/utils";

// CONSTANTS
const SCRIPT_NAME = process.argv[1].split("/").at(-1)!;
const MOCK_DATA_PATH = "./mock_data";

// TYPES
type Options = Partial<{
  printManual: boolean;
  importData: boolean;
  deleteData: boolean;
  verboseMode: boolean;
}>;

// UTILITIES

function log(value: unknown) {
  console.log(`${SCRIPT_NAME} - ${value}`);
}

function logIfVerbose(value: unknown) {
  if (options.verboseMode === true) log(`[VERBOSE] - ${value}`);
}

function logErr(err: unknown) {
  console.error(SCRIPT_NAME + " - [ERROR] - " + err);
}

function logErrAndExit(err: unknown, exitCode: number): never {
  logErr(err);
  process.exit(exitCode);
}

// FUNCTIONS

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {};

  args.forEach(arg => {
    if (!arg.startsWith("-")) logErrAndExit(`user supplied invalid argument: '${arg}'`, 1);

    const flagSegment = arg.slice(1); // turn '-rwx' into 'rwx' (one flagSegment can contain multiple flags)
    const flags = flagSegment.split(""); // split 'rwx' into ['r', 'w', 'x']

    for (const flag of flags) {
      switch (flag) {
        case "h": {
          options.printManual = true;
          break;
        }

        case "v": {
          options.verboseMode = true;
          break;
        }

        case "i": {
          options.importData = true;
          break;
        }

        case "d": {
          options.deleteData = true;
          break;
        }

        default:
          logErrAndExit(`user supplied invalid option: '${flag}'`, 1);
      }
    }
  });

  return options;
}

async function connectWithDB() {
  logIfVerbose("retrieving mongo environmental variables...");

  const MONGO_PORT = getEnvVar("MONGO_PORT");
  const MONGO_PASSWORD = getEnvVar("MONGO_PASSWORD");
  const MONGO_USERNAME = getEnvVar("MONGO_USERNAME");
  const MONGO_URL = getEnvVar("MONGO_URL")
    .replace(/{PASSWORD}/, MONGO_PASSWORD)
    .replace(/{USERNAME}/, MONGO_USERNAME)
    .replace(/{PORT}/, MONGO_PORT);

  logIfVerbose("connecting to database...");

  await mongoose.connect(MONGO_URL).catch(err => logErrAndExit(err, 2));
}

async function disconnectFromDB() {
  logIfVerbose("disconnecting from database...");

  await mongoose.disconnect().catch(err => logErrAndExit(err, 5));
}

async function deleteData() {
  logIfVerbose("deleting documents...");

  try {
    await Bootcamp.deleteMany();
    await Course.deleteMany();

    log("successfully deleted data");
  } catch (err) {
    logErr("deleting documents failed");
    logErrAndExit(err, 3);
  }
}

async function importData() {
  logIfVerbose("importing data...");

  try {
    const courses = JSON.parse(fs.readFileSync(`${__dirname}/${MOCK_DATA_PATH}/courses.json`, "utf-8"));
    const bootcamps = JSON.parse(fs.readFileSync(`${__dirname}/${MOCK_DATA_PATH}/bootcamps.json`, "utf-8"));

    await Course.create(courses);

    // avoid geocode middleware request limit (free provider imposes one) by creating one bootcamp at a time (there's only a few of them so throughput won't be a problem)
    for (const bootcamp of bootcamps) await Bootcamp.create(bootcamp).catch(err => logErrAndExit(err, 3));

    log("successfully imported data");
  } catch (err) {
    logErr("importing data failed");
    logErrAndExit(err, 4);
  }
}

function printManual() {
  const manual = `
NAME
      ${SCRIPT_NAME} - seeds database with mock_data

SYNOPSIS
      ${SCRIPT_NAME} [-h] [-v] [-d] [-i]

DESCRIPTION
      Simple script meant for seeding dev-camper database with contents of '${MOCK_DATA_PATH}' directory

OPTIONS
      -h
          Get help, print out the manual and exit

      -v
          Turn on verbose mode (increases output)

      -d
          Delete every document from seedable collections

      -i
          Import data / seed collections with mock_data

EXIT CODES

      0  ${SCRIPT_NAME} successfully run, without raising any exceptions

      1  User supplied invalid flag/argument

      2  ${SCRIPT_NAME} failed to connect with database

      3  Document deletion failed

      4  Document creation failed

      5  ${SCRIPT_NAME} failed to disconnect from database
`.trimStart();

  console.log(manual);
  process.exit(0);
}

// MAIN EXECUTION BLOCK

const options = parseArgs();

(async function () {
  if (options.printManual ?? Object.entries(options).length === 0) printManual();
  if (options.deleteData || options.importData) await connectWithDB();
  if (options.deleteData) await deleteData();
  if (options.importData) await importData();
  if (mongoose.connection.readyState === 1) await disconnectFromDB();

  log("successfully executed :)");
  process.exit(0);
})();
