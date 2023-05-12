# DCARB Testing

This repository contains all of the code you need for testing the DCARB Project or DCARB at Cowlar. It consists of automated test cases code that executes End-to-End Testing using the Cypress Javascript Library.

![DCARB Testing Cypress Screen](assets/img/home.png)

## Setup

> Make sure you've setup the project first. i.e the backend, frontend and devOps repos.  
> See [Setting Up Project Locally](#restoring-influx-data-and-running-the-project-locally)

1. Clone the repository

   > Make sure to clone the repository in windows if you are using `WSL` (not inside `WSL`)

   ```
   git clone git@github.com:cowlar/dcarb/dcarb-testing.git
   ```

1. Clone the submodule repository _(You may need to request for access of git@github.com/cowlar/dcarb/dcarb-commons)_

   ```
   cd dcarb-testing
   git submodule update --init
   ```

1. Installing NPM libraries

   ```
   npm ci
   ```

1. Obtain these env files from your team​ and place them in the root of the project:

   - `cypress.env.json` file

     ```json
     {
       "ORGANIZATION_ID": "<ID of organisation>",
       "devUrl": "<Dev URL>",
       "API_URL": "<Backend API URL>",

       "DASHBOARD_LOGIN_CEO_USERNAME_1": "CEO Username",
       "DASHBOARD_LOGIN_CEO_PASSWORD": "CEO Password",

       "superAdminEmail": "Super Admin Email",
       "superAdminPassword": "Super Admin Password",

       "adminEmail": "Admin Email",
       "adminPassword": "Admin Password",

       "ceoEmail": "CEO Email",
       "ceoPassword": "CEO Password",

       "operatorEmail": "Operator Email",
       "operatorPassword": "Operator Password",

       "customerEmail": "Customer Email",
       "customerPassword": "Customer Password"
     }
     ```

   - and `.env` file

     ```bash
     TEST_ENVIRONMENT="<Environment>"
     STAGING_TICKET="<JIRA Ticket for Staging Test Results>"

     XRAY_CLOUD_JIRA_URL="https://<JIRA Poject URL>"
     XRAY_CLOUD_AUTH_URL="https://xray.cloud.getxray.app/api/v2/authenticate"
     XRAY_CLIENT_ID="<XRAY Client ID>"
     XRAY_CLIENT_SECRET="<XRAY Client Secret>"

     SLACK_WEBHOOK_INTERNAL="<Slack Incoming Webhook>"
     SLACK_ACCESS_TOKEN="xoxb-<Slack API Access Token>"
     SLACK_POST_MESSAGE_URL="https://slack.com/api/chat.postMessage"
     SLACK_CHANNEL_ID="<Slack Channel's ID, to post results to>"
     ```

1. Open the Cypress tool

   ```
   npm run cy:dev
   ```

## Creating Test Case Template

`gen` is a node script that creates template files, in their respective folders, with boilerplate code and file extension.  
 _Flags starting with dashes i.e_ `--fixture` and `--help` , _work when script is run as_ `node scripts/template-gen.js`, _but not with_ `npm run gen`

Syntax

```bash
npm run gen <testCaseName> [fixture]
```

For example if you want to create files for _DC-123_SomeTestCase_ test case  
Run

```bash
npm run gen DC-123_SomeTestCase
```

> Note that we've given no file extension above.

Running above command will ask you to:

- Select the folder to put test case in.
- Enter description of the test case.

After hitting `enter` it creates two files:

- `cypress/e2e/TestCases/<folder>/DC-123_SomeTestCase.cy.js`
- `cypress/support/TestCases/<folder>/DC-123_SomeTestCase.js`

ℹ️ _If files exist already, it will skip those and won't overwrite them._

If fixture file is also needed, pass `fixture` flag at the end. i.e.

Run

```bash
npm run gen DC-123_SomeTestCase fixture
```

Now above command creates three files:

- `cypress/e2e/TestCases/<folder>/DC-123_SomeTestCase.cy.js`
- `cypress/support/TestCases/<folder>/DC-123_SomeTestCase.js`
- `cypress/fixtures/<folder>/DC-123_SomeTestCase.json`

To show help

```bash
npm run gen help
```

## Restoring Influx data and running the project locally

> If you don't have **Docker** installed on your machine, See [Installing Docker](./docker-install.md)

1. Obtain these env files from your team and place them in `./docker-compose/`:
   - `.env`
   - `backend.env`
   - `frontend.env`
1. Login to `registery.github.com`
   ```bash
   docker login registry.github.com
   ```
   It will ask for your github username and password/access token
1. Change directory to `./docker-compose`

   ```
   cd docker-compose
   ```

1. Start the docker containers for the project in the background​ (on linux run it with **`sudo`**)

   ```bash
   docker compose up -d -V
   ```

1. Open [ _(InfluxDB)_ localhost:8086](http://localhost:8086) and login using credentials in the provided `.env` file

1. Obtain the InfluxDB API token from the InfluxDB dashboard and save it in the `.env` and `backend.env` files in `./docker-compose/` folder

1. Run a command in InfluxDB container to load data

   ```
   docker exec  -it dcarb-influxdb2.local bash
   ```

1. (In Linux) Get read/write access to `./docker-compose/backups` folder. Run below command in `./docker-compose` folder
   ```bash
   sudo chmod 777 ./backups
   ```
1. Get the zip file for the backup from your team. Extract it in `./docker-compose/backups` folder, then run following command in linux shell inside docker. _Anything inside `./docker-compose/backups` folder will become accessable inside the influx container_

   ```
   influx restore /usr/backups/<backup folder> -t <influxdb_token>
   ```

1. Open [_(Adminer)_ localhost:8085](http://localhost:8085), login and directly import the backup files
