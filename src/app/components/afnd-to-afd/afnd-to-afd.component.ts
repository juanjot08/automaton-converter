import { Component, OnInit } from '@angular/core';
import { Automaton } from '../../models/automaton';
import { AutomatonService } from '../../services/automaton.service';

@Component({
  selector: 'app-afnd-to-afd',
  templateUrl: './afnd-to-afd.component.html',
  styleUrls: ['./afnd-to-afd.component.scss']
})
export class AfndToAfdComponent implements OnInit {
  afnd: Automaton | null = null;
  afd: Automaton | null = null;

  constructor(private automatonService: AutomatonService) { }

  ngOnInit(): void {
    this.automatonService.automaton$.subscribe(automaton => {
      this.afnd = automaton;
    });

    this.automatonService.afd$.subscribe(automaton => {
      this.afd = automaton;
    });
  }
}
