// PACKAGES
import fs from "fs";
import mongoose from "mongoose";

// PROJECT_MODULES
import Bootcamp from "./src/models/bootcampModel";
import Course from "./src/models/courseModel";
import { getEnvVar } from "./src/utils";

const MONGO_PASSWORD = getEnvVar("MONGO_PASSWORD");
const MONGO_USERNAME = getEnvVar("MONGO_USERNAME");

const DB_URL = getEnvVar("MONGO_URL")
  .replace(/<PASSWORD>/, MONGO_PASSWORD)
  .replace(/<USERNAME>/, MONGO_USERNAME);

const SCRIPT_NAME = process.argv[1].split("/").at(-1)!.replace(/\..*$/, "");

(async function (dbUrl: string) {
  await mongoose.connect(dbUrl).catch(err => handleErr(err, 2));
  console.log(`${SCRIPT_NAME} is connected with the database (:`);

  const flags = process.argv.slice(2);

  for (const flag of flags) {
    switch (flag) {
      case "-h": {
        printManual();
        break;
      }
      case "-i": {
        await importData();
        break;
      }
      case "-d": {
        await deleteData();
        break;
      }
      default: {
        console.error("user supplied invalid option: " + flag);
        process.exit(1);
      }
    }
  }

  process.exit(0);
})(DB_URL);

async function deleteData() {
  await Bootcamp.deleteMany().catch(err => handleErr(err, 3));
  await Course.deleteMany().catch(err => handleErr(err, 3));

  console.log(`${SCRIPT_NAME} successfully deleted all documents`);
}

async function importData() {
  const bootcamps = JSON.parse(fs.readFileSync(`${__dirname}/mock_data/bootcamps.json`, "utf-8"));
  const courses = JSON.parse(fs.readFileSync(`${__dirname}/mock_data/courses.json`, "utf-8"));

  await Course.create(courses).catch(err => handleErr(err, 3));

  // create one bootcamp at the time because of geocode middleware (free provider limits quantity of requests per second)
  for (const bootcamp of bootcamps) await Bootcamp.create(bootcamp).catch(err => handleErr(err, 3));

  console.log(`${SCRIPT_NAME} successfully imported data`);
}

function handleErr(err: Error, exitCode: number) {
  console.error(err);
  process.exit(exitCode);
}

function printManual() {
  const manual = `
               NAME
                     ${SCRIPT_NAME} - seeds database with mock_data

               SYNOPSIS
                     ${SCRIPT_NAME} [OPTION]...

               DESCRIPTION
                     ${SCRIPT_NAME} is a simple script meant for seeding dev-camper database with mock_data

               OPTIONS
                     -d
                         delete every document from collections which can be seeded with ${SCRIPT_NAME}

                     -i
                         import data / seed collections with mock_data

               EXIT CODES
                     exit code indicates whether script successfully run.
                     Different exit codes indicate different causes of script failure

                     0  script successfully run, without raising any exception

                     1  user supplied invalid option

                     2  ${SCRIPT_NAME} failed to connect with database

                     3  mongoose query method threw exception
  `;

  console.log(manual);
}
