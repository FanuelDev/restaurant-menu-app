describe("Authentication — Login", () => {
  beforeEach(() => {
    cy.logout()
    cy.visit("/login")
  })

  it("affiche le formulaire de connexion", () => {
    cy.get('input[type="email"]').should("be.visible")
    cy.get('input[type="password"]').should("be.visible")
    cy.get('button[type="submit"]').should("be.visible")
    cy.contains("Se connecter").should("be.visible")
  })

  it("affiche une erreur avec des identifiants invalides", () => {
    cy.get('input[type="email"]').type("invalid@test.com")
    cy.get('input[type="password"]').type("WrongPass123!")
    cy.get('button[type="submit"]').click()
    cy.contains(/identifiants|incorrect|invalide/i).should("be.visible")
  })

  it("connecte un admin et redirige vers le dashboard", () => {
    cy.loginViaUI(Cypress.env("adminEmail"), Cypress.env("adminPassword"))
    cy.url().should("include", "/admin/dashboard")
    cy.contains(/bonjour|catégories|plats/i, { timeout: 8000 }).should("be.visible")
  })

  it("connecte un caissier et redirige vers le dashboard", () => {
    cy.loginViaUI(Cypress.env("cashierEmail"), Cypress.env("cashierPassword"))
    cy.url().should("include", "/admin/dashboard")
    cy.contains(/bonjour|catégories|plats/i, { timeout: 8000 }).should("be.visible")
  })

  it("connecte le super admin et redirige vers le super-admin dashboard", () => {
    cy.loginViaUI(Cypress.env("superAdminEmail"), Cypress.env("superAdminPassword"))
    cy.url().should("include", "/super-admin")
  })

  it("persiste la session après reload", () => {
    cy.loginAs("admin")
    cy.visit("/admin/dashboard")
    cy.reload()
    cy.url().should("include", "/admin/dashboard")
    cy.contains(/bonjour|catégories|plats/i, { timeout: 8000 }).should("be.visible")
  })

  it("redirige vers /login si non authentifié", () => {
    cy.visit("/admin/dashboard")
    cy.url().should("include", "/login")
  })

  it('lien "Mot de passe oublié" visible', () => {
    cy.contains(/mot de passe oublié/i).should("be.visible")
    cy.contains(/mot de passe oublié/i).click()
    cy.url().should("include", "/forgot-password")
  })
})
