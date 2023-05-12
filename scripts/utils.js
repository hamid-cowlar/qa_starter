const path = require("path");
const fs = require("fs");

function getAbsPath(...paths) {
  return path.join(__dirname, ...paths);
}

function matchImports(contents) {
  const re =
    /import(?:["'\s]*([\w*{}\n\r\t, ]+)from\s*)?["'\s].*([@\w_-]+)["'\s].*;$/gm;

  return contents.toString().match(re);
}

function appendNewLine(content, lines = 1) {
  if (!content) return "";

  return (
    content +
    Array.from(Array(lines).keys())
      .map(() => "\n")
      .join("")
  );
}

function createFileIfNotExists(filePath, contents) {
  // Do not overrite existing files
  if (fs.existsSync(filePath)) {
    console.log("❗️ Exists Already: ", appendNewLine(filePath));
    return;
  }
  fs.writeFileSync(filePath, contents);
  console.log("✅ Created File: ", appendNewLine(filePath));
}

function mkdirIfNotExists(dirName) {
  if (fs.existsSync(dirName)) {
    console.log("Dir Exists Already: ", dirName);
    return;
  }

  fs.mkdirSync(dirName);
}

function getDateTime() {
  return new Date().toLocaleString().replace(/\//g, "-");
}

function getTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function chunkify(array, parts) {
  const arrayToSplit = [...array];
  let result = [];
  for (let i = parts; i > 0; i--) {
    result.push(arrayToSplit.splice(0, Math.ceil(arrayToSplit.length / i)));
  }
  return result;
}

function msToTime(s) {
  let ms = s % 1000;
  s = (s - ms) / 1000;
  let secs = doubleDigit(s % 60);
  s = (s - secs) / 60;
  let mins = doubleDigit(s % 60);
  let hrs = doubleDigit((s - mins) / 60);

  return hrs + ":" + mins + ":" + secs;
}

function doubleDigit(val) {
  return val < 10 && val >= 0 ? `0${val}` : val;
}

function getArgs() {
  return process.argv.slice(2).map((arg) => arg.replace("--", ""));
}

function capitalize([firstLetter, ...rest]) {
  return firstLetter.toUpperCase() + rest.join("");
}

function fillOrKill(envName) {
  const val = fill(envName);
  if (!val) {
    console.log(`${envName} is required to be in .env file!`);
    process.exit(1);
  }

  return val;
}

function fill(envName, defaults = "") {
  const val = process.env[envName] || defaults;
  return val;
}

module.exports = {
  getAbsPath,
  matchImports,
  appendNewLine,
  createFileIfNotExists,
  getDateTime,
  getTimezone,
  chunkify,
  msToTime,
  getArgs,
  capitalize,
  fillOrKill,
  fill,
  mkdirIfNotExists,
};
