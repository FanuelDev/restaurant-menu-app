import { ApplicationConfig, isDevMode, provideZoneChangeDetection } from '@angular/core'
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router'
import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'
import { provideTransloco, TranslocoHttpLoader } from '@jsverse/transloco'
import { routes } from './app.routes'
import { authInterceptor } from './shared/interceptors/auth.interceptor'
import { tenantInterceptor } from './shared/interceptors/tenant.interceptor'

const savedLang = (typeof localStorage !== 'undefined' ? localStorage.getItem('lang') : null) ?? 'fr'

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withInterceptors([tenantInterceptor, authInterceptor])),
    provideAnimationsAsync(),
    provideTransloco({
      config: {
        availableLangs: ['fr', 'en'],
        defaultLang: savedLang,
        fallbackLang: 'fr',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
  ],
}
