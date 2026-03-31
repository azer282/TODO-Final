describe("Search", () => {
  const password = "P@ssw0rd!";
  const email = `search_${Date.now()}@example.com`;

  before(() => {
    cy.apiRegister(email, password).then(() => cy.apiLogin(email, password)).then((token) => {
      return cy.apiCreateTodo(token, { title: "Alpha Unique", details: "hello world", priority: "low", dueDate: null, isPublic: false })
        .then(() => cy.apiCreateTodo(token, { title: "Beta", details: "something else", priority: "low", dueDate: null, isPublic: false }));
    });
  });

  beforeEach(() => {
    cy.visit("/login");
    cy.get("[data-cy=login-email]").clear().type(email);
    cy.get("[data-cy=login-password]").clear().type(password);
    cy.get("[data-cy=login-submit]").click();
    cy.location("pathname").should("eq", "/todos");
  });

  it("Search - keyword matches title/details", () => {
    cy.get("[data-cy=filter-search]").clear().type("Alpha");
    cy.get("[data-cy=filter-apply]").click();

    cy.contains("Alpha Unique").should("exist");
  });

  it("Search - keyword excludes non-matching items", () => {
    cy.get("[data-cy=filter-search]").clear().type("Alpha");
    cy.get("[data-cy=filter-apply]").click();

    cy.contains("Beta").should("not.exist");
  });
});
