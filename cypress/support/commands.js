// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
import "@4tw/cypress-drag-drop";
import "cypress-real-events/support";
import "cypress-plugin-tab";
import "cypress-file-upload";

Cypress.Commands.add("removePlanogramTrolley", (id) => {
  cy.request({
    url: Cypress.env("API_URL") + `/auth`,
    method: "POST",
    body: {
      email: Cypress.env("superAdminEmail"),
      password: Cypress.env("superAdminPassword"),
    },
  }).then((response) => {
    console.log(response);
    console.log(response.body.data.accessToken);
    cy.request({
      method: "DELETE",
      url: `${Cypress.env("API_URL")}/data/remove/trolley/${id}`,

      headers: {
        authorization: response.body.data.accessToken,
      },
      body: {
        trolleyId: id,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).has.property("data", "Trolley Removed");
    });
  });
});

Cypress.Commands.add("createDevice", (serialNo) => {
  cy.request({
    url: Cypress.env("API_URL") + `/auth`,
    method: "POST",
    body: {
      email: Cypress.env("superAdminEmail"),
      password: Cypress.env("superAdminPassword"),
    },
  }).then((response) => {
    console.log(response);
    console.log(response.body.data.accessToken);
    cy.request({
      method: "POST",
      url: `${Cypress.env("API_URL")}/device/create`,
      headers: {
        authorization: response.body.data.accessToken,
      },
      body: {
        serial: serialNo,
        device_type: 25,
        pin_code: 1111,
      },
    })
      .then((response) => {
        expect(response.status).to.eq(200);
      })
      .then((response) => {
        return cy.wrap(response.body.data.id);
      });
  });
});

Cypress.Commands.add("removePlanogramData", () => {
  cy.request({
    url: Cypress.env("API_URL") + `/auth`,
    method: "POST",
    body: {
      email: Cypress.env("superAdminEmail"),
      password: Cypress.env("superAdminPassword"),
    },
  }).then((response) => {
    console.log(response);
    cy.request({
      method: "DELETE",
      url: Cypress.env("API_URL") + `/data/remove`,
      headers: {
        authorization: "Bearer " + response.body.data.accessToken,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).should("not.exist");
    });
  });
});

Cypress.Commands.add("verifySelectableOptions", (selectId, expectedOptions) => {
  // Cypress returns array of elements in .then() as callback param
  // we are getting first element of array as `options`
  cy.get(selectId).then(([options]) => {
    const actual = [...options].map(({ value }) => value); // getting option values
    expect(actual).to.deep.eq(expectedOptions);
  });
});

Cypress.Commands.add(
  "expectTagName",
  { prevSubject: true },
  ($element, tagName) => {
    expect($element.prop("tagName")).to.equal(tagName);
    return $element;
  },
);

Cypress.Commands.add("addtesttodevice", () => {
  cy.request({
    url: Cypress.env("API_URL") + `/auth`,
    method: "POST",
    body: {
      email: Cypress.env("superAdminEmail"),
      password: Cypress.env("superAdminPassword"),
    },
  }).then((response) => {
    cy.request({
      method: "POST",
      url: `${Cypress.env("API_URL")}/device/d-scope/285/logs`,
      headers: {
        authorization: response.body.data.accessToken,
      },
      body: {
        id: 285,
        date: new Date(),
        serialNo: 154268,
        stationSerialNo: "4103667840-P03361-010-001",
        globalPass: "pass",
      },
    })
      .then((response) => {
        expect(response.status).to.eq(200);
      })
      .then((response) => {
        return cy.wrap(response.body.data.id);
      });
  });
});
