require("dotenv").config();
const Script = require("./Script");
const { threadGen, replyGen, config } = require("./config");
const { getArgs } = require("./utils");

const [testType] = getArgs();

const script = new Script(config);

switch (testType) {
  case "smoke":
    runSmoke();
    break;
  case "all":
    runRegression();
    break;
  case "post-to-jira":
    postJira();
    break;
  case "single":
    runSingle();
    break;
  default:
    runSmoke();
}

function runSmoke() {
  script
    .smoke()
    .run()
    .then(() => script.postJira())
    .then(() => script.generateStatsMessage(threadGen))
    .then(() => script.postWebhooks())
    .then(() => script.createSlackThread())
    .then((thread) => script.replyFailedList(thread, replyGen))
    .catch((err) => console.log(err.message));
}

function runRegression() {
  script
    .regression()
    .run()
    .then(() => script.postJira())
    .then(() => script.generateStatsMessage(threadGen))
    .then(() => script.postWebhooks())
    .then(() => script.createSlackThread())
    .then((thread) => script.replyFailedList(thread, replyGen))
    .catch((err) => console.log(err.message));
}

function runSingle() {
  script
    .specs(
      "cypress/e2e/Logs/FOS-889_LogsVefifyingPopupUI.cy.js",
      "AUTO-FETCH-VERSION-DEBUG",
    )
    .run()
    .then(() => script.postJira())
    .then(() => script.generateStatsMessage(threadGen))
    .then(() => script.postWebhooks())
    .then(() => script.createSlackThread())
    .then((thread) => script.replyFailedList(thread, replyGen))
    .catch((err) => console.log(err.message));
}

function postJira() {
  script
    .smoke()
    .run()
    .then(() => script.postJira())
    .catch((err) => console.log(err.message));
}
