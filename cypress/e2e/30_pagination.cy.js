describe("Pagination", () => {
  const password = "P@ssw0rd!";
  const email = `page_${Date.now()}@example.com`;

  before(() => {
    cy.apiRegister(email, password).then(() => cy.apiLogin(email, password)).then((token) => {
      const creates = [];
      for (let i = 0; i < 25; i++) {
        creates.push(cy.apiCreateTodo(token, {
          title: `Paged ${i}`,
          details: "",
          priority: "low",
          dueDate: null,
          isPublic: false
        }));
      }
      return cy.wrap(creates);
    });
  });

  beforeEach(() => {
    cy.visit("/login");
    cy.get("[data-cy=login-email]").clear().type(email);
    cy.get("[data-cy=login-password]").clear().type(password);
    cy.get("[data-cy=login-submit]").click();
    cy.location("pathname").should("eq", "/todos");
  });

  it("Pagination - list shows multiple pages when many todos exist", () => {
    cy.get("[data-cy=todos-pagination]").should("exist");
    // if totalPages is >= 2, pagination will have a "2" button
    cy.get("[data-cy=todos-pagination]").contains("2").should("exist");
  });

  it("Pagination - navigating pages changes visible items", () => {
    cy.contains("Paged 0").should("exist");
    cy.get("[data-cy=todos-pagination]").contains("2").click();
    cy.contains("Paged 0").should("not.exist");
  });
});
