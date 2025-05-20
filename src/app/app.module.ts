import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AutomatonInputComponent } from './components/automaton-input/automaton-input.component';
import { AutomatonDiagramComponent } from './components/automaton-diagram/automaton-diagram.component';
import { AfndToAfdComponent } from './components/afnd-to-afd/afnd-to-afd.component';
import { AutomatonTableComponent } from './components/automaton-table/automaton-table.component';

@NgModule({
  declarations: [
    AppComponent,
    AutomatonInputComponent,
    AutomatonDiagramComponent,
    AfndToAfdComponent,
    AutomatonTableComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
