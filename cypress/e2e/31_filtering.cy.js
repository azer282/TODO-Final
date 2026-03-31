describe("Filtering", () => {
  const password = "P@ssw0rd!";
  const email = `filter_${Date.now()}@example.com`;

  before(() => {
    cy.apiRegister(email, password).then(() => cy.apiLogin(email, password)).then((token) => {
      return cy.apiCreateTodo(token, { title: "High priority item", details: "", priority: "high", dueDate: null, isPublic: false })
        .then(() => cy.apiCreateTodo(token, { title: "Low priority item", details: "", priority: "low", dueDate: null, isPublic: false }))
        .then(() => cy.request({
          method: "GET",
          url: `${Cypress.env("apiBaseUrl")}/api/todos?search=High%20priority%20item`,
          headers: { Authorization: `Bearer ${token}` }
        }).then((res) => {
          const id = res.body.items?.[0]?.id;
          if (!id) return;
          return cy.request({
            method: "PATCH",
            url: `${Cypress.env("apiBaseUrl")}/api/todos/${id}/completion`,
            headers: { Authorization: `Bearer ${token}` },
            body: { isCompleted: true }
          });
        }));
    });
  });

  beforeEach(() => {
    cy.visit("/login");
    cy.get("[data-cy=login-email]").clear().type(email);
    cy.get("[data-cy=login-password]").clear().type(password);
    cy.get("[data-cy=login-submit]").click();
    cy.location("pathname").should("eq", "/todos");
  });

  it("Filtering - status filter returns only completed", () => {
    cy.get("[data-cy=filter-status]").click();
    cy.get("li").contains("Completed").click();
    cy.get("[data-cy=filter-apply]").click();

    cy.contains("High priority item").parents("tr").contains("completed");
    cy.contains("Low priority item").should("not.exist");
  });

  it("Filtering - priority filter returns only high", () => {
    cy.get("[data-cy=filter-priority]").click();
    cy.get("li").contains("High").click();
    cy.get("[data-cy=filter-apply]").click();

    cy.contains("High priority item").should("exist");
    cy.contains("Low priority item").should("not.exist");
  });
});
