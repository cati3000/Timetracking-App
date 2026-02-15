import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';
import { AppRoutingModule } from './app/app-routing.module';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http'; // Add this import

if (process.env['NODE_ENV'] === 'production') {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      CommonModule, 
      AppRoutingModule,
      HttpClientModule // Add this to provide HttpClient
    ),
    provideAnimations(),
  ],
}).catch(err => console.error(err));