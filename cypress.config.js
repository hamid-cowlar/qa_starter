const { defineConfig } = require("cypress");
module.exports = defineConfig({
  viewportWidth: 1600,
  viewportHeight: 1000,
  chromeWebSecurity: false,
  video: false,
  retries: {
    runMode: 1,
    openMode: 1,
  },

  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require("./cypress/plugins/index.js")(on, config);
    },
  },

  component: {
    devServer: {
      framework: "vue-cli",
      bundler: "webpack",
    },
  },
});
