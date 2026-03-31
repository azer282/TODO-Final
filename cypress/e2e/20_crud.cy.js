describe("CRUD", () => {
  const password = "P@ssw0rd!";
  const email = `crud_${Date.now()}@example.com`;

  before(() => {
    cy.apiRegister(email, password);
  });

  beforeEach(() => {
    cy.visit("/login");
    cy.get("[data-cy=login-email]").clear().type(email);
    cy.get("[data-cy=login-password]").clear().type(password);
    cy.get("[data-cy=login-submit]").click();
    cy.location("pathname").should("eq", "/todos");
  });

  it("CRUD - create todo via UI", () => {
    cy.get("[data-cy=todo-create]").click();
    cy.get("[data-cy=todo-title]").type("Buy groceries");
    cy.get("[data-cy=todo-details]").type("Milk and bread");
    cy.get("[data-cy=todo-save]").click();

    cy.contains("Buy groceries").should("exist");
  });

  it("CRUD - update todo via UI", () => {
    // Create first
    cy.get("[data-cy=todo-create]").click();
    cy.get("[data-cy=todo-title]").type("Old title");
    cy.get("[data-cy=todo-save]").click();
    cy.contains("Old title").should("exist");

    // Click edit (first matching row)
    cy.get("[data-cy^=todo-edit-]").first().click();
    cy.get("[data-cy=todo-title]").clear().type("New title");
    cy.get("[data-cy=todo-save]").click();

    cy.contains("New title").should("exist");
  });

  it("CRUD - toggle completed/uncompleted", () => {
    cy.get("[data-cy=todo-create]").click();
    cy.get("[data-cy=todo-title]").type("Toggle me");
    cy.get("[data-cy=todo-save]").click();
    cy.contains("Toggle me").should("exist");

    cy.get("[data-cy^=todo-toggle-]").first().click();
    cy.contains("Toggle me").parents("tr").contains("completed");

    cy.get("[data-cy^=todo-toggle-]").first().click();
    cy.contains("Toggle me").parents("tr").contains("active");
  });

  it("CRUD - delete todo via UI", () => {
    cy.get("[data-cy=todo-create]").click();
    cy.get("[data-cy=todo-title]").type("Delete me");
    cy.get("[data-cy=todo-save]").click();
    cy.contains("Delete me").should("exist");

    cy.on("window:confirm", () => true);
    cy.contains("Delete me").parents("tr").find("[data-cy^=todo-delete-]").click();
    cy.contains("Delete me").should("not.exist");
  });

  it("Validation - rejects invalid todo title", () => {
    cy.get("[data-cy=todo-create]").click();
    cy.get("[data-cy=todo-title]").type("a"); // too short per spec
    cy.get("[data-cy=todo-save]").click();
    // App shows an error in the top alert if backend rejects
    cy.get("[data-cy=todos-error]").should("exist");
  });
});
