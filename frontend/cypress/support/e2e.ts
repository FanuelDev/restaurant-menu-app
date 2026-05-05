import "./commands"

Cypress.on("uncaught:exception", (err) => {
  if (
    err.message.includes("ResizeObserver") ||
    err.message.includes("Zone") ||
    err.message.includes("ExpressionChangedAfterItHasBeenCheckedError")
  ) {
    return false
  }
  return undefined
})

beforeEach(() => {
  cy.window().then((win) => {
    win.localStorage.clear()
  })
})
