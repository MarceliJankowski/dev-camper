// PACKAGES
import fs from "fs";
import mongoose from "mongoose";

// MODULES
import Bootcamp from "./src/models/bootcampModel";
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

// CODE
const options = parseArgs();

(async function () {
  if (options.printManual ?? Object.entries(options).length === 0) printManual();
  if (options.deleteData || options.importData) await connectWithDB();
  if (options.deleteData) await deleteData();
  if (options.importData) await importData();

  log("successfully executed (:");
  process.exit(-1);
})();

// FUNCTIONS

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {};

  args.forEach(arg => {
    if (!arg.startsWith("-")) logErrAndExit(`${SCRIPT_NAME} - user supplied invalid argument: '${arg}'`, 1);

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
          logErrAndExit(`${SCRIPT_NAME} - user supplied invalid option: '${flag}'`, 1);
      }
    }
  });

  return options;
}

async function connectWithDB() {
  const MONGO_PORT = getEnvVar("MONGO_PORT");
  const MONGO_PASSWORD = getEnvVar("MONGO_PASSWORD");
  const MONGO_USERNAME = getEnvVar("MONGO_USERNAME");
  const MONGO_URL = getEnvVar("MONGO_URL")
    .replace(/{PASSWORD}/, MONGO_PASSWORD)
    .replace(/{USERNAME}/, MONGO_USERNAME)
    .replace(/{PORT}/, MONGO_PORT);

  await mongoose.connect(MONGO_URL).catch(err => logErrAndExit(err, 2));

  logIfVerbose("successfully connected with database");
}

async function deleteData() {
  await Bootcamp.deleteMany().catch(err => logErrAndExit(err, 3));

  logIfVerbose("successfully deleted all documents");
}

async function importData() {
  const bootcamps = JSON.parse(fs.readFileSync(`${__dirname}/${MOCK_DATA_PATH}/bootcamps.json`, "utf-8"));
  await Bootcamp.create(bootcamps).catch(err => logErrAndExit(err, 4));

  logIfVerbose("successfully imported data");
}

function printManual() {
  const manual = `
NAME
      ${SCRIPT_NAME} - seeds database with mock_data

SYNOPSIS
      ${SCRIPT_NAME} [OPTION]...

DESCRIPTION
      ${SCRIPT_NAME} is a simple script meant for seeding dev-camper database with contents of '${MOCK_DATA_PATH}' directory

OPTIONS
      -d
          Delete every document from 'bootcamps' collection

      -i
          Import data / seed 'bootcamp' collection with mock_data

EXIT CODES

      0  ${SCRIPT_NAME} successfully run, without raising any exceptions

      1  User supplied invalid option

      2  ${SCRIPT_NAME} failed to connect with database

      3  Document deletion failed

      4  Document creation failed
`.trimStart();

  console.log(manual);
  process.exit(0);
}

// UTILITIES

function log(value: unknown) {
  console.log(`${SCRIPT_NAME} - ${value}`);
}

function logIfVerbose(value: unknown) {
  if (options.verboseMode === true) log(value);
}

function logErrAndExit(err: unknown, exitCode: number): never {
  console.error(err);
  process.exit(exitCode);
}
