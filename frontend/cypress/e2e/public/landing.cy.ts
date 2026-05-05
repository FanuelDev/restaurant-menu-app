describe("Site vitrine — Landing page", () => {
  beforeEach(() => {
    cy.visit("/")
  })

  it("affiche la section hero avec le titre principal", () => {
    cy.get("section, h1").first().should("be.visible")
  })

  it("affiche la navigation avec les liens principaux", () => {
    cy.contains(/fonctionnalités|features/i).should("exist")
    cy.contains(/tarifs|pricing/i).should("exist")
  })

  it("affiche la section pricing avec les plans", () => {
    cy.contains(/tarifs|pricing|plans/i).should("exist")
    cy.contains(/gratuit|free/i, { timeout: 8000 }).should("be.visible")
    cy.contains(/pro/i).should("be.visible")
    cy.contains(/enterprise/i).should("be.visible")
  })

  it("affiche les prix des plans", () => {
    cy.contains(/0\s*(FCFA|XOF|€|F)?|gratuit/i, { timeout: 8000 }).should("be.visible")
  })

  it("le bouton CTA du hero redirige vers /login ou /register", () => {
    cy.get('a[href*="login"], a[href*="register"], button')
      .contains(/commencer|démarrer|essayer|s'inscrire/i)
      .first()
      .click()
    cy.url().should("match", /\/(login|register)/)
  })

  it("affiche un lien Se connecter", () => {
    cy.contains(/se connecter|connexion/i).should("be.visible")
  })

  it("le toggle mensuel/annuel fonctionne", () => {
    cy.contains(/an|annuel|yearly/i).click({ force: true })
    cy.contains(/économi|save|an/i).should("exist")
  })

  it("charge les features des plans depuis l'API", () => {
    cy.intercept("GET", "**/api/public/plans**").as("plans")
    cy.visit("/")
    cy.wait("@plans").its("response.statusCode").should("eq", 200)
  })
})
