describe("Authentication", () => {
  const password = "P@ssw0rd!";
  const userA = `userA_${Date.now()}@example.com`;
  const userB = `userB_${Date.now()}@example.com`;

  it("Auth - register works", () => {
    cy.visit("/register");
    cy.get("[data-cy=register-email]").type(userA);
    cy.get("[data-cy=register-password]").type(password);
    cy.get("[data-cy=register-submit]").click();

    // After register we should land on /todos
    cy.location("pathname").should("eq", "/todos");
  });

  it("Auth - login works", () => {
    cy.apiRegister(userB, password).then((res) => {
      expect([201, 409]).to.include(res.status);
    });

    cy.visit("/login");
    cy.get("[data-cy=login-email]").type(userB);
    cy.get("[data-cy=login-password]").type(password);
    cy.get("[data-cy=login-submit]").click();

    cy.location("pathname").should("eq", "/todos");
  });

  it("Auth - user cannot access another user's todo", () => {
    const u1 = `iso1_${Date.now()}@example.com`;
    const u2 = `iso2_${Date.now()}@example.com`;

    cy.apiRegister(u1, password).then(() => cy.apiLogin(u1, password)).then((token1) => {
      return cy.apiCreateTodo(token1, {
        title: "Private todo",
        details: "should be private",
        priority: "medium",
        dueDate: null,
        isPublic: false
      }).then((todo) => ({ token1, todo }));
    }).then(({ todo }) => {
      return cy.apiRegister(u2, password).then(() => cy.apiLogin(u2, password)).then((token2) => {
        return cy.request({
          method: "GET",
          url: `${Cypress.env("apiBaseUrl")}/api/todos/${todo.id}`,
          headers: { Authorization: `Bearer ${token2}` },
          failOnStatusCode: false
        });
      });
    }).then((res) => {
      expect([403, 404]).to.include(res.status);
    });
  });
});
