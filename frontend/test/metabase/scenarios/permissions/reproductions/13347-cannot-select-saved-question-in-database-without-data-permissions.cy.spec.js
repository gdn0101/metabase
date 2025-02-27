import {
  restore,
  withDatabase,
  startNewQuestion,
} from "__support__/e2e/cypress";
import { USER_GROUPS } from "__support__/e2e/cypress_data";

const { ALL_USERS_GROUP } = USER_GROUPS;
const PG_DB_ID = 2;

// NOTE: This issue wasn't specifically related to PostgreSQL. We simply needed to add another DB to reproduce it.
describe.skip("issue 13347", () => {
  beforeEach(() => {
    cy.intercept("POST", "/api/dataset").as("dataset");

    restore("postgres-12");
    cy.signInAsAdmin();

    cy.updatePermissionsGraph({
      [ALL_USERS_GROUP]: {
        1: { data: { schemas: "all", native: "write" } },
        [PG_DB_ID]: { data: { schemas: "none", native: "none" } },
      },
    });

    cy.updateCollectionGraph({
      [ALL_USERS_GROUP]: { root: "read" },
    });

    withDatabase(
      PG_DB_ID,
      ({ ORDERS_ID }) =>
        cy.createQuestion({
          name: "Q1",
          query: { "source-table": ORDERS_ID },
          database: PG_DB_ID,
        }),

      cy.createNativeQuestion({
        name: "Q2",
        native: { query: "SELECT * FROM ORDERS" },
        database: PG_DB_ID,
      }),
    );
  });

  ["QB", "Native"].forEach(test => {
    it(`${test.toUpperCase()} version:\n should be able to select question (from "Saved Questions") which belongs to the database user doesn't have data-permissions for (metabase#13347)`, () => {
      cy.signIn("none");

      startNewQuestion();
      cy.findByText("Saved Questions").click();

      test === "QB" ? cy.findByText("Q1").click() : cy.findByText("Q2").click();

      cy.wait("@dataset", { timeout: 5000 });
      cy.contains("37.65");
    });
  });
});
