describe("Admin — Plats (Menu Items)", () => {
  beforeEach(() => {
    cy.loginAs("admin")
    cy.visit("/admin/menu-items")
  })

  it("affiche la liste des plats", () => {
    cy.get('[class*="item"], [class*="dish"], tr, [class*="card"]', { timeout: 10000 })
      .should("have.length.gt", 0)
  })

  it("affiche un bouton pour ajouter un plat", () => {
    cy.contains(/ajouter|créer|nouveau plat/i).should("be.visible")
  })

  it("ouvre le formulaire de création de plat", () => {
    cy.contains(/ajouter|créer|nouveau plat/i).click()
    cy.get('input[formcontrolname="name"], input[name="name"]', { timeout: 4000 })
      .should("be.visible")
    cy.get('input[formcontrolname="price"], input[name="price"]')
      .should("be.visible")
  })

  it("crée un nouveau plat avec nom et prix", () => {
    const name = `Plat Test ${Date.now()}`
    cy.contains(/ajouter|créer|nouveau plat/i).click()
    cy.get('input[formcontrolname="name"], input[name="name"]', { timeout: 4000 }).type(name)
    cy.get('input[formcontrolname="price"], input[name="price"]').type("2500")
    cy.get('select[formcontrolname="categoryId"], select[name="categoryId"]')
      .find("option")
      .not('[value=""]')
      .first()
      .then((opt) => {
        cy.get('select[formcontrolname="categoryId"], select[name="categoryId"]')
          .select(opt.val() as string)
      })
    cy.get('button[type="submit"]').click()
    cy.contains(name, { timeout: 8000 }).should("be.visible")
  })

  it("filtre les plats par catégorie", () => {
    cy.get('select[class*="filter"], [class*="filter"] select, [data-cy="category-filter"]', { timeout: 8000 })
      .first()
      .then(($el) => {
        cy.wrap($el).find("option").not('[value=""]').first().then((opt) => {
          cy.wrap($el).select(opt.val() as string)
        })
      })
    cy.get('[class*="item"], [class*="dish"], tr', { timeout: 6000 })
      .should("have.length.gt", 0)
  })

  it("active/désactive un plat", () => {
    cy.get('[class*="toggle"], [data-cy*="toggle"]', { timeout: 8000 })
      .first()
      .click()
    cy.contains(/mis à jour|modifié|success/i, { timeout: 6000 }).should("exist")
  })

  it("modifie un plat existant", () => {
    cy.get('[class*="edit"], button[aria-label*="modifier"], [data-cy*="edit"]', { timeout: 8000 })
      .first()
      .click()
    cy.get('input[formcontrolname="name"], input[name="name"]', { timeout: 4000 })
      .clear()
      .type("Plat Modifié")
    cy.get('button[type="submit"]').click()
    cy.contains("Plat Modifié", { timeout: 8000 }).should("exist")
  })

  it("supprime un plat", () => {
    cy.get('[class*="delete"], button[aria-label*="supprimer"], [data-cy*="delete"]', { timeout: 8000 })
      .first()
      .click()
    cy.contains(/confirmer|oui|supprimer/i, { timeout: 4000 }).click()
    cy.contains(/supprimé|success/i, { timeout: 6000 }).should("exist")
  })

  it("un caissier ne peut pas ajouter de plat", () => {
    cy.loginAs("cashier")
    cy.visit("/admin/menu-items")
    cy.contains(/ajouter|créer/i).should("not.exist")
  })
})
