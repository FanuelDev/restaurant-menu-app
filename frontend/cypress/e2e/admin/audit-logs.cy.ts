describe("Admin — Journal d'audit", () => {
  beforeEach(() => {
    cy.loginAs("admin")
    cy.visit("/admin/audit-logs")
  })

  it("affiche la liste des événements d'audit", () => {
    cy.get('[class*="log"], [class*="event"], tr', { timeout: 8000 })
      .should("have.length.gt", 0)
  })

  it("affiche la date et l'heure de chaque événement", () => {
    cy.get('[class*="date"], [class*="time"], td:first-child', { timeout: 8000 })
      .first()
      .should("be.visible")
  })

  it("affiche l'action effectuée", () => {
    cy.get('[class*="action"], td, [class*="event"]', { timeout: 8000 })
      .filter(":contains('CREATE'), :contains('UPDATE'), :contains('DELETE'), :contains('LOGIN')")
      .should("have.length.gt", 0)
  })

  it("affiche l'utilisateur qui a effectué l'action", () => {
    cy.get('[class*="user"], [class*="actor"]', { timeout: 8000 })
      .first()
      .should("be.visible")
  })

  it("permet de filtrer par type d'action", () => {
    cy.get('select[class*="filter"], [class*="filter"] select', { timeout: 8000 })
      .first()
      .then(($sel) => {
        cy.wrap($sel).find("option").not('[value=""]').first().then((opt) => {
          cy.wrap($sel).select(opt.val() as string)
        })
      })
    cy.get('[class*="log"], tr', { timeout: 6000 }).should("have.length.gt", 0)
  })

  it("permet de filtrer par période (date)", () => {
    cy.get('input[type="date"], [class*="date-filter"]', { timeout: 8000 })
      .should("exist")
  })

  it("charge les logs via l'API", () => {
    cy.intercept("GET", "**/api/audit-logs**").as("logs")
    cy.visit("/admin/audit-logs")
    cy.wait("@logs").its("response.statusCode").should("eq", 200)
  })

  it("un caissier ne peut pas accéder aux logs d'audit", () => {
    cy.loginAs("cashier")
    cy.visit("/admin/audit-logs")
    cy.url().should("satisfy", (url: string) =>
      !url.includes("/admin/audit-logs") || url.includes("/dashboard")
    )
  })
})
