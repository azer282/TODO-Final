import scoreConfig from "../score.config.js";

const state = {
  startedAt: new Date().toISOString(),
  categories: {},
  totalEarned: 0,
  maxEarnable: 0
};

const buildIndex = () => {
  const index = new Map(); // title -> { categoryName, pointsPerTest, bucket }
  for (const cat of scoreConfig.categories) {
    const perTest = cat.points / cat.tests.length;
    for (const t of cat.tests) {
      index.set(t.title, { categoryName: cat.name, pointsPerTest: perTest, bucket: cat.bucket });
    }
  }
  return index;
};

const index = buildIndex();

const ensureCategory = (name) => {
  if (!state.categories[name]) {
    state.categories[name] = { earned: 0, max: 0, passed: 0, total: 0 };
  }
};

const addMaxes = () => {
  for (const cat of scoreConfig.categories) {
    ensureCategory(cat.name);
    state.categories[cat.name].max = cat.points;
    state.categories[cat.name].total = cat.tests.length;
    state.maxEarnable += cat.points;
  }
};

addMaxes();

Cypress.on("test:after:run", (test, runnable) => {
  const title = test.title;
  const meta = index.get(title);
  if (!meta) return;

  ensureCategory(meta.categoryName);

  if (test.state === "passed") {
    state.categories[meta.categoryName].earned += meta.pointsPerTest;
    state.categories[meta.categoryName].passed += 1;
    state.totalEarned += meta.pointsPerTest;
  }
});

after(() => {
  // Round to 2 decimals for display
  for (const k of Object.keys(state.categories)) {
    state.categories[k].earned = Math.round(state.categories[k].earned * 100) / 100;
  }
  state.totalEarned = Math.round(state.totalEarned * 100) / 100;

  // Print summary
  // eslint-disable-next-line no-console
  console.log("\n===== SCORE SUMMARY =====");
  for (const [name, v] of Object.entries(state.categories)) {
    // eslint-disable-next-line no-console
    console.log(`${name}: ${v.earned}/${v.max} (passed ${v.passed}/${v.total})`);
  }
  // eslint-disable-next-line no-console
  console.log(`TOTAL: ${state.totalEarned}/${state.maxEarnable}`);
  // eslint-disable-next-line no-console
  console.log("========================\n");

  cy.task("writeScore", { filePath: "cypress/results/score.json", data: state });
});


Cypress.Commands.add("apiRegister", (email, password, displayName = "") => {
  return cy.request({
    method: "POST",
    url: `${Cypress.env("apiBaseUrl")}/api/auth/register`,
    body: { email, password, displayName },
    failOnStatusCode: false
  });
});

Cypress.Commands.add("apiLogin", (email, password) => {
  return cy.request({
    method: "POST",
    url: `${Cypress.env("apiBaseUrl")}/api/auth/login`,
    body: { email, password }
  }).then((res) => res.body.accessToken);
});

Cypress.Commands.add("apiCreateTodo", (token, todo) => {
  return cy.request({
    method: "POST",
    url: `${Cypress.env("apiBaseUrl")}/api/todos`,
    headers: { Authorization: `Bearer ${token}` },
    body: todo
  }).then((res) => res.body);
});


