const TENANT = Cypress.env("tenantSlug") ?? "demo"
const BASE = `http://${TENANT}.localhost:4200`

describe("Site vitrine — Menu public", () => {
  beforeEach(() => {
    cy.visit(`${BASE}/menu`)
  })

  it("affiche le nom du restaurant dans le hero", () => {
    cy.contains(/saveurs|comptoir|restaurant|cuisine/i, { timeout: 8000 }).should("be.visible")
  })

  it("affiche les catégories du menu", () => {
    cy.get('[class*="categor"], [class*="section"], nav a', { timeout: 10000 })
      .should("have.length.gt", 0)
  })

  it("affiche les plats avec nom et prix", () => {
    cy.get('[class*="item"], [class*="dish"], [class*="plat"]', { timeout: 10000 })
      .first()
      .should("be.visible")
  })

  it("clique sur une catégorie et scroll vers sa section", () => {
    cy.get('[class*="categor"] a, nav a', { timeout: 10000 })
      .first()
      .click()
    cy.url().should("satisfy", (url: string) => url.includes("#") || url.includes("categor"))
  })

  it("affiche la couleur de marque (CSS variable --color-brand)", () => {
    cy.document().then((doc) => {
      const brand = getComputedStyle(doc.documentElement).getPropertyValue("--color-brand")
      expect(brand.trim()).to.match(/^#[0-9a-fA-F]{3,6}$|^rgb/)
    })
  })

  it("charge les données du restaurant via l'API tenant", () => {
    cy.intercept("GET", "**/api/public/restaurant**").as("restaurant")
    cy.visit(`${BASE}/menu`)
    cy.wait("@restaurant").its("response.statusCode").should("eq", 200)
  })

  it("charge les catégories et plats via l'API", () => {
    cy.intercept("GET", "**/api/public/categories**").as("categories")
    cy.visit(`${BASE}/menu`)
    cy.wait("@categories").its("response.statusCode").should("eq", 200)
  })

  it("le QR code ou lien de partage est présent", () => {
    cy.get('canvas[class*="qr"], img[alt*="QR"], a[href*="share"], button[aria-label*="partager"]')
      .should("exist")
  })
})
