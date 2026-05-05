/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      loginAs(role: "superAdmin" | "admin" | "cashier" | "admin2"): Chainable<void>
      loginViaUI(email: string, password: string): Chainable<void>
      logout(): Chainable<void>
      waitForAngular(): Chainable<void>
      getByCy(selector: string): Chainable<JQuery<HTMLElement>>
    }
  }
}

const API = Cypress.env("apiUrl")

Cypress.Commands.add("loginAs", (role) => {
  const creds = {
    superAdmin: { email: Cypress.env("superAdminEmail"), password: Cypress.env("superAdminPassword") },
    admin:      { email: Cypress.env("adminEmail"),      password: Cypress.env("adminPassword") },
    cashier:    { email: Cypress.env("cashierEmail"),    password: Cypress.env("cashierPassword") },
    admin2:     { email: Cypress.env("adminEmail2"),     password: Cypress.env("adminPassword2") },
  }[role]

  cy.request({
    method: "POST",
    url: `${API}/auth/login`,
    body: creds,
    headers: { "Content-Type": "application/json" },
  }).then(({ body }) => {
    // Use cy.window() to access the AUT window, not the Cypress runner window
    cy.window().then((win) => {
      win.localStorage.setItem("rm_token", JSON.stringify(body.token))
      win.localStorage.setItem("rm_user", JSON.stringify(body.user))
      if (body.restaurant) {
        win.localStorage.setItem("rm_restaurant", JSON.stringify(body.restaurant))
      }
    })
  })
})

Cypress.Commands.add("loginViaUI", (email, password) => {
  cy.visit("/login")
  cy.get('input[type="email"]').type(email)
  cy.get('input[type="password"]').type(password)
  cy.get('button[type="submit"]').click()
})

Cypress.Commands.add("logout", () => {
  cy.window().then((win) => {
    win.localStorage.removeItem("rm_token")
    win.localStorage.removeItem("rm_user")
    win.localStorage.removeItem("rm_restaurant")
  })
})

Cypress.Commands.add("waitForAngular", () => {
  cy.window().then((win: any) => {
    if (win.getAllAngularTestabilities) {
      return new Cypress.Promise((resolve) => {
        const check = (): void => {
          const stabilities = win.getAllAngularTestabilities()
          const stable = stabilities.every((t: any) => t.isStable())
          if (stable) resolve(null)
          else setTimeout(check, 50)
        }
        check()
      })
    }
    return undefined
  })
})

Cypress.Commands.add("getByCy", (selector) => {
  return cy.get(`[data-cy="${selector}"]`)
})

export {}
