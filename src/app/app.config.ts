import {ApplicationConfig, importProvidersFrom} from '@angular/core';
import {provideRouter, withViewTransitions} from '@angular/router';
import { routes } from './app.routes';
import {provideAnimations} from "@angular/platform-browser/animations";
import {initializeApp, provideFirebaseApp} from "@angular/fire/app";
import {getAuth, provideAuth} from "@angular/fire/auth";
import {getFirestore, provideFirestore} from "@angular/fire/firestore";
import {getStorage, provideStorage} from "@angular/fire/storage";
import {HttpClient, provideHttpClient} from "@angular/common/http";
import {FIREBASE_OPTIONS} from "@angular/fire/compat";
import {environment} from "../environments/environment";
import {MissingTranslationHandler, TranslateLoader, TranslateModule} from "@ngx-translate/core";
import {TranslateHttpLoader} from "@ngx-translate/http-loader";
import {MissingTranslationService} from "./shared/services/missing-translation.service";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withViewTransitions()),
    provideAnimations(),
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    importProvidersFrom([
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: httpLoaderFactory,
          deps: [HttpClient],
        },
        missingTranslationHandler: {
          provide: MissingTranslationHandler,
          useClass: MissingTranslationService
        },
        useDefaultLang: true
      })
    ]),
    { provide: FIREBASE_OPTIONS, useValue: environment.firebase },
  ]
};

export function httpLoaderFactory(http: HttpClient): TranslateLoader {
  return new TranslateHttpLoader(http, './assets/locale/', '.json');
}
