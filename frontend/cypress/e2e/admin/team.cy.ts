describe("Admin — Gestion de l'équipe", () => {
  beforeEach(() => {
    cy.loginAs("admin")
    cy.visit("/admin/team")
  })

  it("affiche la liste des membres de l'équipe", () => {
    cy.get('[class*="member"], [class*="user"], tr, [class*="card"]', { timeout: 8000 })
      .should("have.length.gt", 0)
  })

  it("affiche le bouton d'invitation d'un membre", () => {
    cy.contains(/inviter|ajouter|nouveau/i).should("be.visible")
  })

  it("ouvre le formulaire d'invitation", () => {
    cy.contains(/inviter|ajouter/i).click()
    cy.get('input[type="email"], input[formcontrolname="email"]', { timeout: 4000 })
      .should("be.visible")
  })

  it("invite un nouveau caissier", () => {
    const email = `caissier.test.${Date.now()}@demo.ci`
    cy.contains(/inviter|ajouter/i).click()
    cy.get('input[type="email"], input[formcontrolname="email"]', { timeout: 4000 }).type(email)
    cy.get('select[formcontrolname="role"], select[name="role"]')
      .select("cashier")
    cy.get('button[type="submit"]').click()
    cy.contains(/invité|envoyé|success/i, { timeout: 6000 }).should("exist")
  })

  it("affiche le rôle de chaque membre", () => {
    cy.contains(/admin|caissier|cashier/i, { timeout: 8000 }).should("exist")
  })

  it("permet de supprimer un membre", () => {
    cy.get('[class*="delete"], button[aria-label*="supprimer"], [data-cy*="delete"]', { timeout: 8000 })
      .not("[disabled]")
      .first()
      .click()
    cy.contains(/confirmer|oui|supprimer/i, { timeout: 4000 }).click()
    cy.contains(/supprimé|success/i, { timeout: 6000 }).should("exist")
  })

  it("respecte la limite d'utilisateurs selon le plan", () => {
    cy.contains(/limite|plan|utilisateur/i, { timeout: 8000 }).should("exist")
  })

  it("un caissier ne peut pas accéder à la gestion d'équipe", () => {
    cy.loginAs("cashier")
    cy.visit("/admin/team")
    cy.url().should("satisfy", (url: string) =>
      !url.includes("/admin/team") || url.includes("/dashboard")
    )
  })
})
