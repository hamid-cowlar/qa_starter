const { msToTime, fillOrKill, capitalize, fill } = require("./utils");

const testEnv = process.env.TEST_ENVIRONMENT || "staging";

module.exports.config = {
  cypress: {
    resultsDir: "../results",
    browser: "electron",
    specs: {
      smoke: "cypress/e2e/**/*",
      regression: "cypress/e2e/**/*",
    },
  },
  xray: {
    cloudUrl: fillOrKill("XRAY_CLOUD_JIRA_URL"),
    authUrl: fillOrKill("XRAY_CLOUD_AUTH_URL"),
    client: {
      id: fillOrKill("XRAY_CLIENT_ID"),
      secret: fillOrKill("XRAY_CLIENT_SECRET"),
    },
  },
  jira: {
    ticket: fillOrKill(`${testEnv.toUpperCase()}_TICKET`),
  },
  slack: {
    webhooks: [fillOrKill("SLACK_WEBHOOK_INTERNAL")],
    messageUrl: fillOrKill("SLACK_POST_MESSAGE_URL"),
    accessToken: fillOrKill("SLACK_ACCESS_TOKEN"),
    channelId: fillOrKill("SLACK_CHANNEL_ID"),
  },
  testingEnvironment: testEnv,
  moduleName: fillOrKill("TEST_MODULE_NAME"),
  gitlab: {
    projectId: fillOrKill("GITLAB_PROJECT_ID"),
    privateToken: fillOrKill("PRIVATE_TOKEN"),
    tagsUrl: fillOrKill("GITLAB_TAGS_URL"),
    triggeredBy: fill("GITLAB_USER_NAME"),
  },
  failedListParser: parser,
};

module.exports.replyGen = function (data) {
  return data.map((test) => {
    const err = test.failure.$.message;
    return {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*<https://viaphoton.atlassian.net/browse/${test.info.ticket}|${test.info.ticket}>* _${test.info.name}_\nType: *${test.failure.$.type}*\n${err}`,
      },
    };
  });
};

module.exports.threadGen = function (data) {
  const results = {
    totalTests: { title: "Total Tests", icon: ":clipboard:" },
    totalPassed: { title: "Passed", icon: ":white_check_mark:" },
    totalFailed: { title: "Failed", icon: ":x:" },
    totalSkipped: { title: "Skipped", icon: ":no_entry:" },
    totalPending: { title: "Pending", icon: ":clock3:" },
    totalDuration: {
      title: "Duration",
      icon: ":hourglass:",
      formatter: msToTime,
    },
  };

  let resultsStr = "";
  for (let key in results) {
    const value = results[key].formatter // check if `formatter` key is present
      ? results[key].formatter(data[key]) // call the `formatter` on the value
      : data[key];

    //check if value exists or greater than 0
    if (value) {
      resultsStr += `${results[key].icon}${results[key].title}: *${value}*\n\t`;
    }
  }

  const jobUrl = fill("CI_JOB_URL");
  const jobUrlLink = jobUrl && `<${jobUrl}|Gitlab Pipeline>`;

  const body = {
    type: "mrkdwn",
    text: `\`\`\`
               Branch: ${(fill("CI_COMMIT_BRANCH"), "N/A")}
             Job Name: ${fill("CI_JOB_NAME", "Local Run")}
                    ---
      Modules Covered: ${data.moduleName} ${data.moduleVersion}
         Triggered By: ${data.triggerdBy}
          Environment: ${capitalize(data.testingEnvironment)}
             Test Set: ${data.testSet}
\`\`\`

    Test Results Updated in Ticket: <https://viaphoton.atlassian.net/browse/${
      data.ticketKey
    }|${data.ticketKey}>\
    ${jobUrlLink}

    ${resultsStr}
`,
  };
  return body;
};

function parser(jsonContents) {
  // 1. selecting required keys from the json result
  const jsonFilteredProps = jsonContents.map((json) => {
    const t = json.testsuites.testsuite;
    const failed = json.testsuites.$.failures === "1";
    const name = t[1].testcase[0].$.classname;
    const testFile = t[0].$.file.split("/").at(-1);

    return {
      info: {
        file: t[0].$.file,
        ticket: testFile.split("_")[0],
        name,
        time_taken: t[0].$.time,
        timestamp: new Date(t[0].$.timestamp).toLocaleString(),
      },
      failed,
      failure: failed ? t[1].testcase[0].failure[0] : {},
    };
  });

  // 2. filtering out failed test cases
  return jsonFilteredProps.filter((test) => test.failed);
}
