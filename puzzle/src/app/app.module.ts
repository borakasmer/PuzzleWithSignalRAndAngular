import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';

import { BackgroundImage } from './background-image';
import { PuzzleService } from '../Services/Indexservice';
import { ThreePairsPipe } from './threepairs';
import { ControlPageComponent } from './controlpage.component';

import { routing } from './app.routes';
import { MainComponent } from './main.component';

@NgModule({
  declarations: [
    AppComponent,
    ControlPageComponent,
    MainComponent,
    BackgroundImage,
    ThreePairsPipe
  ],
  imports: [
    BrowserModule,
    HttpModule,
    FormsModule,
    routing
  ],
  providers: [PuzzleService],
  bootstrap: [AppComponent]
})
export class AppModule { }
