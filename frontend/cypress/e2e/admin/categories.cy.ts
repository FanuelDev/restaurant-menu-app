describe("Admin — Catégories", () => {
  beforeEach(() => {
    cy.loginAs("admin")
    cy.visit("/admin/categories")
  })

  it("affiche la liste des catégories", () => {
    cy.get('[class*="categor"], [class*="list-item"], tr', { timeout: 8000 })
      .should("have.length.gt", 0)
  })

  it("affiche un bouton pour créer une catégorie", () => {
    cy.contains(/ajouter|créer|nouvelle catégorie/i).should("be.visible")
  })

  it("ouvre le modal/formulaire de création", () => {
    cy.contains(/ajouter|créer|nouvelle catégorie/i).click()
    cy.get('input[name="name"], input[placeholder*="nom"], input[formcontrolname="name"]', { timeout: 4000 })
      .should("be.visible")
  })

  it("crée une nouvelle catégorie", () => {
    const name = `Test Cat ${Date.now()}`
    cy.contains(/ajouter|créer|nouvelle catégorie/i).click()
    cy.get('input[name="name"], input[formcontrolname="name"]', { timeout: 4000 }).type(name)
    cy.get('button[type="submit"]').click()
    cy.contains(name, { timeout: 6000 }).should("be.visible")
  })

  it("modifie une catégorie existante", () => {
    cy.get('[class*="edit"], button[aria-label*="modifier"], [data-cy*="edit"]', { timeout: 8000 })
      .first()
      .click()
    cy.get('input[name="name"], input[formcontrolname="name"]', { timeout: 4000 })
      .clear()
      .type("Catégorie modifiée")
    cy.get('button[type="submit"]').click()
    cy.contains("Catégorie modifiée", { timeout: 6000 }).should("exist")
  })

  it("supprime une catégorie", () => {
    cy.get('[class*="delete"], button[aria-label*="supprimer"], [data-cy*="delete"]', { timeout: 8000 })
      .first()
      .click()
    cy.contains(/confirmer|oui|supprimer/i, { timeout: 4000 }).click()
    cy.contains(/supprimé|success/i, { timeout: 6000 }).should("exist")
  })

  it("affiche un indicateur d'ordre des catégories", () => {
    cy.get('[class*="sort"], [class*="order"], [class*="drag"]').should("exist")
  })

  it("un caissier ne peut pas créer de catégorie", () => {
    cy.loginAs("cashier")
    cy.visit("/admin/categories")
    cy.contains(/ajouter|créer/i).should("not.exist")
  })
})
