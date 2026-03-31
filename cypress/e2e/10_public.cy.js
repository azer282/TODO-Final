describe("Public Todos", () => {
  const password = "P@ssw0rd!";
  const email = `pub_${Date.now()}@example.com`;

  it("Public - can view public todos without login", () => {
    // Create a public todo via API
    cy.apiRegister(email, password).then(() => cy.apiLogin(email, password)).then((token) => {
      return cy.apiCreateTodo(token, {
        title: "Public todo for guests",
        details: "visible",
        priority: "low",
        dueDate: null,
        isPublic: true
      });
    });

    cy.visit("/public");
    cy.get("[data-cy=public-table]").should("exist");
    cy.contains("Public todo for guests").should("exist");
  });
});
