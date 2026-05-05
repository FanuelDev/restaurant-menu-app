describe("Admin — Paramètres restaurant", () => {
  beforeEach(() => {
    cy.loginAs("admin")
    cy.visit("/admin/restaurant")
  })

  it("affiche le formulaire de paramètres", () => {
    cy.get('input[formcontrolname="name"], input[name="name"]', { timeout: 8000 })
      .should("be.visible")
  })

  it("affiche les champs nom, téléphone, adresse", () => {
    cy.get('input[formcontrolname="name"], input[name="name"]', { timeout: 8000 }).should("exist")
    cy.get('input[formcontrolname="phone"], input[name="phone"]').should("exist")
    cy.get('input[formcontrolname="address"], input[name="address"], textarea[formcontrolname="address"]').should("exist")
  })

  it("affiche le sélecteur de couleur de marque", () => {
    cy.get('input[type="color"], [class*="color-picker"], [formcontrolname="brandColor"]', { timeout: 8000 })
      .should("exist")
  })

  it("modifie le nom du restaurant et sauvegarde", () => {
    cy.get('input[formcontrolname="name"], input[name="name"]', { timeout: 8000 })
      .clear()
      .type("Mon Restaurant Test")
    cy.get('button[type="submit"]').click()
    cy.contains(/sauvegardé|mis à jour|success/i, { timeout: 6000 }).should("exist")
  })

  it("affiche la zone d'upload du logo", () => {
    cy.get('[class*="logo"], [class*="upload"], input[type="file"]', { timeout: 8000 })
      .should("exist")
  })

  it("affiche la zone d'upload de la couverture", () => {
    cy.get('[class*="cover"], [class*="background"], [class*="banner"]', { timeout: 8000 })
      .should("exist")
  })

  it("affiche le slug du restaurant", () => {
    cy.contains(/slug/i, { timeout: 8000 }).should("exist")
  })

  it("affiche les horaires d'ouverture", () => {
    cy.contains(/horaire|heure|ouverture/i, { timeout: 8000 }).should("exist")
  })

  it("un caissier ne peut pas accéder aux paramètres", () => {
    cy.loginAs("cashier")
    cy.visit("/admin/restaurant")
    cy.url().should("satisfy", (url: string) =>
      !url.includes("/admin/restaurant") || url.includes("/login") || url.includes("/dashboard")
    )
  })
})
