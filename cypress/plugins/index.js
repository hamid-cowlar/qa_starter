/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/**
 * @type {Cypress.PluginConfig}
 */

const struct = require("python-struct");
require("dotenv").config({ override: true });
const mqtt = require("mqtt");

// const host = process.env.MQTT_HOST || "localhost";
// const port = process.env.MQTT_PORT || 8080;
const username = process.env.MQTT_USERNAME || "dockersim-dispenser";
const password = process.env.MQTT_PASSWORD || "CowlarGeyser7890";

const clientId = `floor-tracking-TEST${new Date().getTime()}`;
const pctClientId = `PCT-TEST${new Date().getTime()}`;
const connectUrl = `https://staging.factory-os.viaphoton.com`;

//const connectUrl = `ws://${host}:${port}`;
const options = {
  clientId,
  clean: true,
  username,
  password,
};

const pctOptions = {
  pctClientId,
  clean: true,
  username,
  password,
};

// eslint-disable-next-line no-unused-vars
module.exports = (on, config) => {
  on("task", {
    updateTrolleyState(
      [trolley_status, trolley_id, station_id, barcode],
      tsm = new Date().valueOf(),
      // barcode = "IL220519-0590",
    ) {
      console.log(
        `Dscope data Time: ${tsm} status: ${trolley_status} station_id ${station_id} trolley_id ${trolley_id} Length of barcode: ${barcode.length} Barcode ${barcode}`,
      );
      let packet = struct.pack(
        `QhhhB${barcode.length}s`,
        tsm,
        trolley_status,
        station_id,
        trolley_id,
        barcode.length,
        barcode,
      );
      console.log("after packet");
      const client = mqtt.connect(connectUrl, options);
      console.log("after client");

      client.on("connect", () => {
        client.publish(
          `s/${station_id}/bd`,
          packet,
          { qos: 2, retain: false },
          (error) => {
            if (error) {
              console.error(error);
            } else {
              console.log("Published");
            }
          },
        );
        client.end();
      });
      console.log("after connection");
      return { trolley_id, station_id, trolley_status };
    },
  });
  on("task", {
    updateOperatorState(
      [user_state, user_id, device_id],
      tsm = new Date().valueOf() * 1000,
    ) {
      let packet = struct.pack("QHb", tsm, user_id, user_state);
      const client = mqtt.connect(connectUrl, pctOptions);
      client.on("connect", () => {
        client.publish(
          `d/${device_id}/login`,

          packet,
          { qos: 2, retain: false },
          (error) => {
            if (error) {
              console.error(error);
            } else {
              console.log("Published");
            }
          },
        );
        client.end();
      });
      return { user_id, device_id, user_state };
    },
  });
  on("task", {
    updateDeviceState([device_id, deviceStatus]) {
      let packet = `{ "status": "${deviceStatus}" }`;
      const client = mqtt.connect(connectUrl, pctOptions);
      client.on("connect", () => {
        client.publish(
          `d/${device_id}/status`,
          packet,
          { qos: 0, retain: true },
          (error) => {
            if (error) {
              console.error(error);
            } else {
              console.log("Published");
            }
          },
        );
        client.end();
      });
      return { device_id, deviceStatus };
    },
  });
  // 'ar' for enabling error, 'ac' for disabling error
  on("task", {
    updateRFIDError([device_id, state], tsm = new Date().valueOf() * 1000) {
      let packet = struct.pack("Qb", tsm, 0);
      const client = mqtt.connect(connectUrl, pctOptions);
      client.on("connect", () => {
        client.publish(
          `d/${device_id}/${state}`,
          packet,
          { qos: 2, retain: false },
          (error) => {
            if (error) {
              console.error(error);
            } else {
              console.log("Published");
            }
          },
        );
        client.end();
      });
      return { device_id, state };
    },
  });
};
