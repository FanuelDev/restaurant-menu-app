describe("Authentication — Forgot Password", () => {
  beforeEach(() => {
    cy.logout()
    cy.visit("/forgot-password")
  })

  it("affiche le formulaire de réinitialisation", () => {
    cy.get('input[type="email"]').should("be.visible")
    cy.get('button[type="submit"]').should("be.visible")
    cy.contains(/mot de passe oublié/i).should("be.visible")
  })

  it("affiche une erreur si email vide", () => {
    cy.get('button[type="submit"]').click()
    cy.get('input[type="email"]').then(($input) => {
      expect(($input[0] as HTMLInputElement).validity.valid).to.be.false
    })
  })

  it("affiche un message de confirmation après soumission", () => {
    cy.get('input[type="email"]').type("admin@demo.ci")
    cy.get('button[type="submit"]').click()
    cy.contains(/email envoyé|vérifiez votre boîte|lien de réinitialisation/i).should("be.visible")
  })

  it("lien retour vers login visible et fonctionnel", () => {
    cy.contains(/retour|se connecter/i).click()
    cy.url().should("include", "/login")
  })
})
