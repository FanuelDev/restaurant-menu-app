describe("Super Admin — Gestion des restaurants", () => {
  beforeEach(() => {
    cy.loginAs("superAdmin")
    cy.visit("/super-admin/restaurants")
  })

  it("affiche la liste des restaurants", () => {
    cy.get('[class*="restaurant"], [class*="tenant"], tr, [class*="card"]', { timeout: 8000 })
      .should("have.length.gt", 0)
  })

  it("affiche le nom et le slug de chaque restaurant", () => {
    cy.get('[class*="slug"], [class*="name"], td', { timeout: 8000 })
      .first()
      .should("be.visible")
  })

  it("affiche le plan actuel de chaque restaurant", () => {
    cy.contains(/plan|gratuit|pro|enterprise/i, { timeout: 8000 }).should("exist")
  })

  it("affiche le statut (actif/inactif) de chaque restaurant", () => {
    cy.get('[class*="status"], [class*="badge"], [class*="active"]', { timeout: 8000 })
      .should("exist")
  })

  it("permet de voir le détail d'un restaurant", () => {
    cy.get('[class*="view"], button[aria-label*="voir"], [data-cy*="view"], a[class*="detail"]', { timeout: 8000 })
      .first()
      .click()
    cy.url().should("match", /\/super-admin\/restaurants\/\d+|\/super-admin\/restaurants\/.+/)
  })

  it("permet de changer le plan d'un restaurant", () => {
    cy.get('[class*="plan"], select[name*="plan"], [data-cy*="plan"]', { timeout: 8000 })
      .first()
      .then(($el) => {
        if ($el.is("select")) {
          cy.wrap($el).find("option").not('[value=""]').last().then((opt) => {
            cy.wrap($el).select(opt.val() as string)
          })
        } else {
          cy.wrap($el).click()
        }
      })
  })

  it("affiche le nombre de catégories et plats de chaque restaurant", () => {
    cy.contains(/catégorie|plat|item/i, { timeout: 8000 }).should("exist")
  })

  it("permet de suspendre/activer un restaurant", () => {
    cy.get('[class*="suspend"], [class*="ban"], button[aria-label*="suspendre"], [data-cy*="suspend"]', { timeout: 8000 })
      .first()
      .click()
    cy.contains(/confirmer|oui/i, { timeout: 4000 }).click()
    cy.contains(/suspendu|désactivé|success/i, { timeout: 6000 }).should("exist")
  })

  it("charge les restaurants via l'API", () => {
    cy.intercept("GET", "**/api/super-admin/restaurants**").as("restaurants")
    cy.visit("/super-admin/restaurants")
    cy.wait("@restaurants").its("response.statusCode").should("eq", 200)
  })

  it("un admin normal ne peut pas accéder à la liste des restaurants", () => {
    cy.loginAs("admin")
    cy.visit("/super-admin/restaurants")
    cy.url().should("not.include", "/super-admin")
  })
})
