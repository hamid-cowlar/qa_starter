const fs = require("fs");
const os = require("os");
const path = require("path");

const axios = require("axios");
const cypress = require("cypress");
const xml2js = require("xml2js");
const { mergeFiles } = require("junit-report-merger");

const { getAbsPath, chunkify, capitalize } = require("./utils");

class Script {
  constructor(config = {}) {
    this.xray = {
      cloudUrl: config.xray.cloudUrl,
      authUrl: config.xray.authUrl,
      client: {
        id: config.xray.client.id,
        secret: config.xray.client.secret,
      },
    };

    this.slack = {
      webhooks: [...config.slack.webhooks],
      messageUrl: config.slack.messageUrl,
      accessToken: config.slack.accessToken,
      channelId: config.slack.channelId,
    };

    this.jira = {
      ticket: config.jira.ticket,
    };

    this.cypress = {
      resultsDir: config.cypress.resultsDir,
      browser: config.cypress.browser,
      specs: {
        smoke: config.cypress.specs.smoke,
        regression: config.cypress.specs.regression,
      },
    };

    this.testingEnvironment = config.testingEnvironment;
    this.moduleName = config.moduleName;

    this.gitlab = {
      projectId: config.gitlab.projectId,
      privateToken: config.gitlab.privateToken,
      tagsUrl: config.gitlab.tagsUrl,
      triggeredBy:
        config.gitlab.triggeredBy || capitalize(os.userInfo().username),
    };

    if (this.gitlab.triggeredBy === "Root")
      this.gitlab.triggeredBy = "GitLab CI";

    // internal variables
    this._ = {
      specs: "",
      statsMessage: "",
      jiraTicketUpdated: {},
      testSet: "Smoke",
      cypressResult: {},
      testFilesPath: getAbsPath(this.cypress.resultsDir, "files"),
      resutlsFile: getAbsPath(this.cypress.resultsDir, "test-results-all.xml"),
    };

    this.failedListParser = config.failedListParser;
  }

  smoke() {
    this._.specs = this.cypress.specs.smoke;
    this._.testSet = "Smoke";
    return this;
  }

  regression() {
    this._.specs = this.cypress.specs.regression;
    this._.testSet = "Regression";
    return this;
  }

  specs(specs, testSet = "Specific") {
    this._.testSet = testSet;
    this._.specs = specs;
    return this;
  }

  async generateStatsMessage(generator = () => "") {
    // Get the latest version of the project

    const version = await this.#getProjectVersion();
    console.log({ version });

    this._.statsMessage = generator({
      ...this._.cypressResult,
      testSet: this._.testSet,
      ticketKey: this.jira.ticket,
      testingEnvironment: this.testingEnvironment,
      moduleName: this.moduleName,
      moduleVersion: version,
      triggerdBy: this.gitlab.triggeredBy,
    });

    return this._.statsMessage;
  }

  async run(options = {}) {
    const { preferCache = false } = options;

    const resultsPath = getAbsPath(this.cypress.resultsDir);

    if (!preferCache) {
      // delete previous results dir, if exists
      if (fs.existsSync(resultsPath)) {
        fs.rmdirSync(resultsPath, { recursive: true, force: true });
      } else {
        fs.mkdirSync(this._.testFilesPath, { recursive: true });
      }

      this._.testRunMessage = `Running ${this._.testSet} Test(s)!`;
      console.log(this._.testRunMessage);

      const result = await cypress.run({
        browser: this.cypress.browser,
        headless: true,
        spec: this._.specs,
        reporter: "junit",
        reporterOptions: {
          mochaFile: path.join(this._.testFilesPath, "test-results.[hash].xml"),
          testCaseSwitchClassnameAndName: false,
        },
      });
      this._.cypressResult = result;
    }

    await this.#mergeResultFiles();

    return this;
  }

  async postWebhooks() {
    try {
      const promises = this.slack.webhooks.map((hook) => {
        return axios.post(hook, this._.statsMessage);
      });

      await Promise.all(promises);
      return this;
    } catch (error) {
      console.log(error);
    }
  }

  async postJira() {
    try {
      const authRes = await axios.post(this.xray.authUrl, {
        client_id: this.xray.client.id,
        client_secret: this.xray.client.secret,
      });

      if (authRes.status === 200) console.log("Auth with XRay Successful!");
      else console.log("Auth failed with XRay!");

      // Setting the URL and the Configs for the Request
      const url = `${this.xray.cloudUrl}&testExecKey=${this.jira.ticket}`;

      // Loading the File
      const file = fs.readFileSync(this._.resutlsFile, "utf-8");

      // Sending the Request
      const res = await axios.post(url, file, {
        headers: {
          Authorization: `Bearer ${authRes.data}`,
          "Content-Type": "text/xml",
        },
      });

      // Using the results and the status
      if (res.status === 200) {
        this._.jiraTicketUpdated = res.data.key;
        console.log("Posting Results to Jira Successful!");
      } else {
        console.log("Unable to post results to Jira!");
      }
      return this;
    } catch (error) {
      console.log("Error occurred while posting results to Jira!");
      console.log(error);
    }
  }

  async createSlackThread(body = this._.statsMessage) {
    try {
      const { data } = await axios.post(
        this.slack.messageUrl,
        {
          channel: this.slack.channelId,
          ...body,
        },
        {
          headers: {
            Authorization: `Bearer ${this.slack.accessToken}`,
            ContentType: "application/json",
          },
        },
      );

      if (data.ok) {
        console.log("Posting Stats to Slack Successful!");
        return data;
      }
      console.log(data);
      throw new Error(data.error + ": " + data?.errors?.join());
    } catch (error) {
      console.log("Error while sending stats message!");
      console.log(error);
    }
  }

  async replyFailedList(parentThread, generator) {
    try {
      // Getting list of failed test cases
      const failedTestCasesData = await this.#getFailedTestCases();

      if (failedTestCasesData) {
        console.log("Parsing failed tests list Successful!");
      }

      // Composing Slack Message
      let blocks = generator(failedTestCasesData);

      if (!blocks || !blocks.length) return;

      // Adding divider after each test result
      blocks = blocks.reduce((acc, cur) => {
        acc.push(cur, { type: "divider" });
        return acc;
      }, []);

      // If test results count is greater than 10, split them all in the groups of 10
      if (blocks.length > 10) {
        blocks = chunkify(blocks, Math.ceil(blocks.length / 20));
      } else {
        blocks = [blocks];
      }

      // Posting to Slack each group of results one by one
      const requests = [];
      blocks.forEach((chunk) => {
        // remove divider from start
        if (chunk[0]?.type === "divider") chunk.shift();

        // remove divider from end
        if (chunk.at(-1)?.type === "divider") chunk.pop();

        const promise = this.createSlackThread({
          channel: parentThread.channel,
          thread_ts: parentThread.ts,
          blocks: chunk,
        });
        requests.push(promise);
      });

      // Awaiting to resolve all the promises
      await Promise.all(requests);
      console.log("Sending failing list as a reply, Successful!");
    } catch (err) {
      console.log("Error while replying to stats message");
      console.log(err);
    }
  }

  async #getResultFiles() {
    const { globbySync } = await import("globby");
    const inputFiles = globbySync([`${this._.testFilesPath}/*.xml`]);
    return inputFiles;
  }

  async #mergeResultFiles() {
    const srcFiles = await this.#getResultFiles();

    const mergeMessage = await new Promise((resolve, reject) => {
      mergeFiles(this._.resutlsFile, srcFiles, (err) => {
        if (err) reject("Merging Files Falied!");
        else resolve("Merging Files Successful!");
      });
    });

    console.log(mergeMessage);
  }

  async #getFailedTestCases() {
    const srcFiles = await this.#getResultFiles();
    // 1. getting xml files
    const xmlPromises = [];
    srcFiles.forEach((fileurl) => {
      const promise = new Promise((resolve) => {
        const data = fs.readFileSync(fileurl);
        resolve(data);
      });

      xmlPromises.push(promise);
    });

    const xmlContents = await Promise.all(xmlPromises);

    // 2. converting xml -> json
    const jsonPromises = [];
    xmlContents.forEach((xml) => {
      const promise = new Promise((resolve) => {
        xml2js.parseStringPromise(xml).then((json) => {
          resolve(json);
        });
      });

      jsonPromises.push(promise);
    });

    const jsonContents = await Promise.all(jsonPromises);

    // 3. getting list of failed test cases from parser
    const jsonContentFailedOnly = this.failedListParser(jsonContents);
    return jsonContentFailedOnly;
  }

  async #getProjectVersion() {
    const url = this.gitlab.tagsUrl.replace(
      "GITLAB_PROJECT_ID",
      this.gitlab.projectId,
    );
    console.log({ url });

    try {
      const {
        data: [{ name }],
      } = await axios.get(url, {
        headers: {
          "PRIVATE-TOKEN": this.gitlab.privateToken,
        },
      });

      return name;
    } catch (error) {
      console.log("Unable to get project version");
      console.log(error);
    }
  }
}

module.exports = Script;
