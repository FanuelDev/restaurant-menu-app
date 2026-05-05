describe("Admin — Dashboard", () => {
  beforeEach(() => {
    cy.loginAs("admin")
    cy.visit("/admin/dashboard")
  })

  it("affiche le titre de bienvenue", () => {
    cy.contains(/bonjour/i, { timeout: 8000 }).should("be.visible")
  })

  it("affiche la card Catégories", () => {
    cy.contains(/catégorie/i, { timeout: 8000 }).should("be.visible")
  })

  it("affiche la card Plats au total", () => {
    cy.contains(/plats au total/i, { timeout: 8000 }).should("be.visible")
  })

  it("affiche la card Disponibles", () => {
    cy.contains(/disponible/i, { timeout: 8000 }).should("be.visible")
  })

  it("affiche le plan d'abonnement actuel", () => {
    cy.contains(/plan|abonnement|gratuit|pro|enterprise/i, { timeout: 8000 }).should("exist")
  })

  it("la navigation latérale est visible", () => {
    cy.get("nav, aside, [class*='sidebar'], [class*='sidenav']").should("be.visible")
  })

  it("redirige vers /login si non authentifié", () => {
    cy.logout()
    cy.visit("/admin/dashboard")
    cy.url().should("include", "/login")
  })

  it("un caissier accède au dashboard", () => {
    cy.loginAs("cashier")
    cy.visit("/admin/dashboard")
    cy.url().should("include", "/admin/dashboard")
    cy.contains(/bonjour|catégories|plats/i, { timeout: 8000 }).should("be.visible")
  })
})
