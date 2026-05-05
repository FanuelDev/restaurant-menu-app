describe("Site vitrine — Page Pricing", () => {
  beforeEach(() => {
    cy.visit("/pricing")
  })

  it("affiche les 3 plans depuis l'API", () => {
    cy.contains("Gratuit", { timeout: 8000 }).should("be.visible")
    cy.contains("Pro").should("be.visible")
    cy.contains("Enterprise").should("be.visible")
  })

  it("affiche le prix mensuel par défaut", () => {
    cy.contains(/0\s*(FCFA|XOF|F)?|Gratuit/i, { timeout: 8000 }).should("be.visible")
  })

  it("le toggle annuel affiche les prix annuels et un badge économie", () => {
    cy.contains(/annuel|an\b|yearly/i, { timeout: 6000 }).click({ force: true })
    cy.contains(/économi|save/i).should("be.visible")
  })

  it("un plan est mis en avant (featured)", () => {
    cy.get('[class*="featured"], [class*="highlighted"], [class*="popular"]', { timeout: 8000 })
      .should("exist")
  })

  it("chaque plan affiche ses fonctionnalités avec des indicateurs", () => {
    cy.get('[class*="feature"], li', { timeout: 8000 })
      .should("have.length.gt", 0)
  })

  it('le bouton "Commencer" redirige vers login/register', () => {
    cy.contains(/commencer|choisir|démarrer/i, { timeout: 8000 })
      .first()
      .click()
    cy.url().should("match", /\/(login|register)/)
  })

  it("le nombre de catégories et plats max est affiché", () => {
    cy.contains(/catégorie|plat|item/i, { timeout: 8000 }).should("exist")
  })

  it("intercepte l'API plans et valide la réponse", () => {
    cy.intercept("GET", "**/api/public/plans**").as("plans")
    cy.visit("/pricing")
    cy.wait("@plans").then(({ response }) => {
      expect(response!.statusCode).to.eq(200)
      expect(response!.body).to.be.an("array").with.length.gt(0)
    })
  })
})
