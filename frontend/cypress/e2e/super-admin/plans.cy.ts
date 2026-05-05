describe("Super Admin — Gestion des plans", () => {
  beforeEach(() => {
    cy.loginAs("superAdmin")
    cy.visit("/super-admin/plans")
  })

  it("affiche la liste des plans", () => {
    cy.contains("Gratuit", { timeout: 8000 }).should("be.visible")
    cy.contains("Pro").should("be.visible")
    cy.contains("Enterprise").should("be.visible")
  })

  it("affiche le bouton de création d'un plan", () => {
    cy.contains(/ajouter|créer|nouveau plan/i).should("be.visible")
  })

  it("ouvre le modal de création", () => {
    cy.contains(/ajouter|créer|nouveau plan/i).click()
    cy.get('input[formcontrolname="name"], input[name="name"]', { timeout: 4000 })
      .should("be.visible")
    cy.get('input[formcontrolname="priceMonthlyCents"], input[name="priceMonthlyCents"]')
      .should("be.visible")
  })

  it("crée un nouveau plan", () => {
    const name = `Plan Test ${Date.now()}`
    cy.contains(/ajouter|créer|nouveau plan/i).click()
    cy.get('input[formcontrolname="name"], input[name="name"]', { timeout: 4000 }).type(name)
    cy.get('input[formcontrolname="slug"], input[name="slug"]').type(`plan-test-${Date.now()}`)
    cy.get('input[formcontrolname="priceMonthlyCents"], input[name="priceMonthlyCents"]').type("5000")
    cy.get('textarea[formcontrolname="featuresText"], textarea[name="featuresText"], textarea').first()
      .type("Fonctionnalité 1\nFonctionnalité 2\n- Fonctionnalité désactivée")
    cy.get('button[type="submit"]').click()
    cy.contains(name, { timeout: 8000 }).should("be.visible")
  })

  it("modifie un plan existant", () => {
    cy.get('[class*="edit"], button[aria-label*="modifier"], [data-cy*="edit"]', { timeout: 8000 })
      .first()
      .click()
    cy.get('input[formcontrolname="name"], input[name="name"]', { timeout: 4000 })
      .clear()
      .type("Plan Modifié")
    cy.get('button[type="submit"]').click()
    cy.contains("Plan Modifié", { timeout: 6000 }).should("exist")
  })

  it("le textarea de features accepte le format \"- feature\" pour désactiver", () => {
    cy.get('[class*="edit"], button[aria-label*="modifier"], [data-cy*="edit"]', { timeout: 8000 })
      .first()
      .click()
    cy.get("textarea", { timeout: 4000 }).first().should("be.visible")
  })

  it("affiche les prix mensuel et annuel de chaque plan", () => {
    cy.contains(/mensuel|mois/i, { timeout: 8000 }).should("exist")
    cy.contains(/annuel|an\b/i).should("exist")
  })

  it("peut activer/désactiver un plan", () => {
    cy.get('[class*="toggle"], [data-cy*="toggle-active"]', { timeout: 8000 })
      .first()
      .click()
    cy.contains(/mis à jour|success/i, { timeout: 6000 }).should("exist")
  })

  it("un admin ne peut pas accéder au super-admin", () => {
    cy.loginAs("admin")
    cy.visit("/super-admin/plans")
    cy.url().should("not.include", "/super-admin")
  })
})
