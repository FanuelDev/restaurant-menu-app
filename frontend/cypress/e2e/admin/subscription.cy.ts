describe("Admin — Abonnement", () => {
  beforeEach(() => {
    cy.loginAs("admin")
    cy.visit("/admin/subscription")
  })

  it("affiche le plan actuel", () => {
    cy.contains(/plan actuel|abonnement actuel|votre plan/i, { timeout: 8000 }).should("be.visible")
  })

  it("affiche les fonctionnalités du plan actuel", () => {
    cy.get('[class*="feature"], [class*="benefit"], li', { timeout: 8000 })
      .should("have.length.gt", 0)
  })

  it("affiche les autres plans disponibles", () => {
    cy.contains(/pro|enterprise|gratuit/i, { timeout: 8000 }).should("be.visible")
  })

  it("affiche le bouton de mise à niveau (upgrade)", () => {
    cy.contains(/mettre à niveau|upgrader|passer au pro|choisir/i, { timeout: 8000 }).should("exist")
  })

  it("affiche le statut de l'abonnement", () => {
    cy.contains(/renouvellement|expiration|actif|actuel/i, { timeout: 8000 }).should("exist")
  })

  it("charge les plans depuis l'API publique", () => {
    cy.intercept("GET", "**/api/public/plans**").as("plans")
    cy.visit("/admin/subscription")
    cy.wait("@plans").its("response.statusCode").should("eq", 200)
  })

  it("affiche le toggle mensuel/annuel sur la page d'abonnement", () => {
    cy.contains(/mensuel|annuel|an\b/i, { timeout: 8000 }).should("exist")
  })
})
