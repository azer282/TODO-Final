describe("Sorting", () => {
  const password = "P@ssw0rd!";
  const email = `sort_${Date.now()}@example.com`;

  before(() => {
    cy.apiRegister(email, password).then(() => cy.apiLogin(email, password)).then((token) => {
      // Create with different due dates
      return cy.apiCreateTodo(token, { title: "B item", details: "", priority: "medium", dueDate: "2026-03-20", isPublic: false })
        .then(() => cy.apiCreateTodo(token, { title: "A item", details: "", priority: "medium", dueDate: "2026-03-10", isPublic: false }));
    });
  });

  beforeEach(() => {
    cy.visit("/login");
    cy.get("[data-cy=login-email]").clear().type(email);
    cy.get("[data-cy=login-password]").clear().type(password);
    cy.get("[data-cy=login-submit]").click();
    cy.location("pathname").should("eq", "/todos");
  });

  it("Sorting - dueDate ascending sorts correctly", () => {
    cy.get("[data-cy=filter-sortBy]").click();
    cy.get("li").contains("Due date").click();
    cy.get("[data-cy=filter-sortDir]").click();
    cy.get("li").contains("Asc").click();
    cy.get("[data-cy=filter-apply]").click();

    cy.get("[data-cy=todos-table] tbody tr").first().contains("A item");
  });

  it("Sorting - title ascending sorts correctly", () => {
    cy.get("[data-cy=filter-sortBy]").click();
    cy.get("li").contains("Title").click();
    cy.get("[data-cy=filter-sortDir]").click();
    cy.get("li").contains("Asc").click();
    cy.get("[data-cy=filter-apply]").click();

    cy.get("[data-cy=todos-table] tbody tr").first().contains("A item");
  });
});
