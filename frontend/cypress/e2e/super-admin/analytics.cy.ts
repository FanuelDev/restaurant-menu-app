describe('Super Admin — Audience Analytics', () => {
  // ── Tracking endpoint (public) ──────────────────────────────────────────────

  describe('POST /api/track', () => {
    it('retourne 204 avec un payload valide', () => {
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/track`,
        body: {
          sessionId: crypto.randomUUID(),
          path: '/m/demo',
          referrer: null,
          restaurantSlug: 'demo',
        },
      }).then((res) => {
        expect(res.status).to.eq(204)
      })
    })

    it('retourne 204 même sans referrer ni restaurantSlug', () => {
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/track`,
        body: {
          sessionId: crypto.randomUUID(),
          path: '/pricing',
        },
      }).then((res) => {
        expect(res.status).to.eq(204)
      })
    })

    it('retourne 422 si sessionId manquant', () => {
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/track`,
        body: { path: '/pricing' },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(422)
      })
    })

    it('retourne 422 si path manquant', () => {
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/track`,
        body: { sessionId: crypto.randomUUID() },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(422)
      })
    })

    it('enregistre plusieurs visites et incrémente le compteur', () => {
      const sessionId = crypto.randomUUID()
      // 3 pages différentes, même session
      const paths = ['/pricing', '/m/demo', '/faq']

      cy.wrap(paths).each((path: string) => {
        cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/track`,
          body: { sessionId, path, referrer: null },
        }).then((res) => {
          expect(res.status).to.eq(204)
        })
      })
    })
  })

  // ── Analytics API (super-admin only) ───────────────────────────────────────

  describe('GET /api/super-admin/analytics/overview', () => {
    it('retourne 401 sans authentification', () => {
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/super-admin/analytics/overview`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([401, 403])
      })
    })

    it('retourne 200 avec token super-admin et la shape correcte', () => {
      cy.loginAs('superAdmin')
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/super-admin/analytics/overview`,
      }).then((res) => {
        expect(res.status).to.eq(200)
        const body = res.body
        expect(body).to.have.all.keys(
          'realtime', 'today', 'week', 'month', 'total', 'totalPageViews', 'topPages'
        )
        expect(body.realtime).to.be.a('number')
        expect(body.today).to.be.a('number')
        expect(body.total).to.be.gte(0)
        expect(body.topPages).to.be.an('array')
      })
    })

    it("retourne 401/403 si l'utilisateur est un admin normal", () => {
      cy.loginAs('admin')
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/super-admin/analytics/overview`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([401, 403])
      })
    })
  })

  describe('GET /api/super-admin/analytics/daily', () => {
    it('retourne un tableau de 30 entrées pour days=30', () => {
      cy.loginAs('superAdmin')
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/super-admin/analytics/daily`,
        qs: { days: 30 },
      }).then((res) => {
        expect(res.status).to.eq(200)
        expect(res.body).to.be.an('array').with.length(30)
        const first = res.body[0]
        expect(first).to.have.all.keys('date', 'visitors', 'pageViews')
        expect(first.date).to.match(/^\d{4}-\d{2}-\d{2}$/)
      })
    })

    it('plafonne days à 90 max', () => {
      cy.loginAs('superAdmin')
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/super-admin/analytics/daily`,
        qs: { days: 999 },
      }).then((res) => {
        expect(res.status).to.eq(200)
        expect(res.body).to.be.an('array').with.length(90)
      })
    })
  })

  // ── Page frontend ───────────────────────────────────────────────────────────

  describe('Page /super-admin/analytics', () => {
    beforeEach(() => {
      cy.loginAs('superAdmin')
      cy.intercept('GET', '**/analytics/overview').as('overview')
      cy.intercept('GET', '**/analytics/daily**').as('daily')
      cy.visit('/super-admin/analytics')
    })

    it('charge la page sans erreur 4xx/5xx', () => {
      cy.wait('@overview').its('response.statusCode').should('eq', 200)
      cy.wait('@daily').its('response.statusCode').should('eq', 200)
    })

    it('affiche les 5 KPI cards', () => {
      cy.wait('@overview')
      cy.get('.kpi-card').should('have.length', 5)
    })

    it("affiche le titre 'Audience'", () => {
      cy.contains('h1', 'Audience').should('be.visible')
    })

    it('affiche le graphique 30 jours', () => {
      cy.wait('@daily')
      cy.contains('Visiteurs uniques').should('be.visible')
    })

    it("affiche le panneau 'Pages les plus visitées'", () => {
      cy.wait('@overview')
      cy.contains('Pages les plus visitées').should('be.visible')
    })

    it('le lien Audience est présent dans le nav super-admin', () => {
      cy.get('.sa-nav').contains('Audience').should('be.visible')
    })

    it("un admin normal est redirigé et ne voit pas la page", () => {
      cy.loginAs('admin')
      cy.visit('/super-admin/analytics')
      cy.url().should('not.include', '/super-admin')
    })
  })

  // ── Tracking intégré dans l'app frontend ────────────────────────────────────

  describe('TrackingService — intégration navigation', () => {
    it('envoie POST /api/track à chaque navigation', () => {
      cy.intercept('POST', '**/api/track').as('trackCall')
      cy.visit('/')
      cy.wait('@trackCall').then((interception) => {
        expect(interception.response?.statusCode).to.eq(204)
        expect(interception.request.body).to.have.property('path', '/')
        expect(interception.request.body).to.have.property('sessionId')
      })
    })

    it('extrait le restaurantSlug sur les pages /m/:slug', () => {
      cy.intercept('POST', '**/api/track').as('trackCall')
      cy.visit('/m/demo')
      cy.wait('@trackCall').then((interception) => {
        expect(interception.request.body.restaurantSlug).to.eq('demo')
      })
    })

    it('restaurantSlug est null sur les pages non-menu', () => {
      cy.intercept('POST', '**/api/track').as('trackCall')
      cy.visit('/pricing')
      cy.wait('@trackCall').then((interception) => {
        expect(interception.request.body.restaurantSlug).to.be.null
      })
    })
  })
})
