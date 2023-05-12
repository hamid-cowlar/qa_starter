const fs = require("fs");
const path = require("path");
const readline = require("readline");
const cliSelect = require("cli-select");

const {
  getAbsPath,
  matchImports,
  appendNewLine,
  mkdirIfNotExists,
  createFileIfNotExists,
} = require("./utils");

(async function main() {
  try {
    const { showHelp, testCaseName: testFile, isFixtureNeeded } = getArgs();
    const paths = {
      e2e: ["e2e"],
      fixtures: ["fixtures"],
      testCases: ["support", "TestCases"],
    };

    if (showHelp) return printHelp();

    const functionName = validateInput(
      testFile,
      "testCaseName is required!",
    ).replace("-", "");

    let [, ...folders] = await selectChildFolderResursive(...paths.e2e);

    mkdirIfNotExists(getCypressPath(...paths.e2e, ...folders));
    mkdirIfNotExists(getCypressPath(...paths.testCases, ...folders));

    const [cyFilePath, fixturePath, testFilePath] = [
      [...paths.e2e, ...folders, testFile + ".cy.js"],
      [...paths.fixtures, ...folders, testFile + ".json"],
      [...paths.testCases, ...folders, testFile + ".js"],
    ].map((p) => path.join(...p));

    const description = await ask("Description: ");

    // create cy file
    createFileIfNotExists(
      getCypressPath(cyFilePath),
      genCyFile(
        functionName,
        description,
        path.join(changeDir(...paths.e2e, ...folders), testFilePath),
      ),
    );

    // Create test file
    createFileIfNotExists(
      getCypressPath(testFilePath),
      genTestFile(functionName),
    );

    // create fixture file
    if (isFixtureNeeded) {
      // create folder in fixtures if not exists
      mkdirIfNotExists(getCypressPath(...paths.fixtures, ...folders));

      // Create fixture file
      createFileIfNotExists(getCypressPath(fixturePath), genFixture());

      // Add fixture import in Test File, if not present
      appendImportInFile(
        getFixtureImport(
          functionName,
          path.join(changeDir(...paths.testCases, ...folders), fixturePath),
        ),
        getCypressPath(testFilePath),
      );
    }
  } catch (err) {
    console.log(err.message);
    printHelp();
    process.exit();
  }
})();

/*** HELPERS ***/

async function selectChildFolderResursive(parentFolder, foldersList = []) {
  const [ROOT, CREATE_NEW_FOLDER] = ["__root__", "__create_new_folder__"];

  let folders = foldersList.concat(parentFolder);
  const childFolders = getChildFolders(...folders);

  if (childFolders && childFolders.length) {
    const selectedFolder = await selectOption(
      `Select Folder in ${folders.at(-1)}`,
      [].concat(ROOT, childFolders, CREATE_NEW_FOLDER),
    );
    if (selectedFolder === CREATE_NEW_FOLDER) {
      let newFolderName = await ask("New Folder Name: ");
      newFolderName = validateInput(
        newFolderName?.trim(),
        "Invalid Folder Name!",
      );
      newFolderName = newFolderName.replace(/ /g, "_"); // Convert spaces to "_"
      folders.push(newFolderName);
    } else if (selectedFolder === ROOT) {
      return folders;
    } else {
      folders = await selectChildFolderResursive(selectedFolder, folders);
    }
  }

  return folders;
}

function changeDir(...paths) {
  return path.join(...paths.map(() => ".."));
}

function getArgs() {
  const [, , testCaseName, optionFlag] = process.argv;
  const isFixtureNeeded =
    optionFlag === "fixture" || optionFlag === "--fixture";
  let showHelp = false;

  if (
    testCaseName === "-h" ||
    testCaseName === "--help" ||
    testCaseName === "help"
  ) {
    showHelp = true;
  }

  return { showHelp, testCaseName, isFixtureNeeded };
}

function ask(question) {
  return new Promise((resolve) => {
    const reader = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    reader.question(question, (desc) => {
      resolve(desc);
      reader.close();
    });
  });
}

async function selectOption(msg, options) {
  console.log(msg);
  const selected = await cliSelect({ values: options });
  return selected.value;
}

function validateInput(input, validationMessage) {
  if (!input || !input.length) throw new Error(validationMessage);
  return input;
}

function appendImportInFile(importStatement, fileName) {
  // Check if `import` statement exists in the file
  let fileContents = fs.readFileSync(fileName).toString();
  const requestedImportInFile = fileContents.match(
    new RegExp(importStatement, "g"),
  );

  // If import is not present in file, append an import
  if (!requestedImportInFile) {
    const imports = matchImports(fileContents)?.join("\n"); // `imports` can be null || []

    // If there are already some import statements
    if (imports) {
      let newImports = appendNewLine(imports) + importStatement;
      fileContents = fileContents.replace(imports, newImports);
    } else {
      fileContents = appendNewLine(importStatement, 2) + fileContents;
    }

    fs.writeFileSync(fileName, fileContents);
    console.log("✅ Added Import:", importStatement);
    console.log("In: ", fileName);
  }
}

function getCypressPath(...paths) {
  return getAbsPath("..", "cypress", ...paths);
}

function noBackSlash(string) {
  return string.replace(/\\/g, "/");
}

function getChildFolders(...parentFolderPath) {
  return fs
    .readdirSync(getCypressPath(...parentFolderPath), { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
}

/*** TEMPLATES ***/

function filterName(name) {
  if (name.includes("/")) {
    return name.split("/").at(-1);
  }

  return name;
}

function genCyFile(functionName, description, testFilePath) {
  return `import ${functionName} from "${noBackSlash(testFilePath)}";

describe("Test Case Automated: ", () => {
  it("${description}", () => {
    ${functionName}();
  });
});
`;
}

function genTestFile(functionName) {
  return `export default function ${filterName(functionName)}() {
  // #1.
  // #2.
  // #3.
}
`;
}

function genFixture() {
  return "{}";
}

function getFixtureImport(functionName, fixturePath) {
  return `import ${filterName(functionName)}Data from "${noBackSlash(
    fixturePath,
  )}";`;
}

function printHelp() {
  const help = `Template Gen Tool, Help:
  Args                Required    Description

  testCaseName        Yes         Name of the test case, without file extension
  fixture, --fixture  No          Flag, create fixture file
  `;

  console.log(help);
}
