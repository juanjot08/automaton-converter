import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { Automaton } from '../../models/automaton';
import { Network, DataSet, Node, Edge, Options } from 'vis-network/standalone';

@Component({
  selector: 'app-automaton-diagram',
  templateUrl: './automaton-diagram.component.html',
  styleUrls: ['./automaton-diagram.component.scss']
})
export class AutomatonDiagramComponent implements OnInit, OnChanges {
  @Input() automaton: Automaton | null = null;
  @ViewChild('networkContainer') networkContainer!: ElementRef;

  private network: Network | null = null;

  constructor() { }

  ngOnInit(): void {
    this.drawNetwork();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['automaton'] && this.automaton) {
      this.drawNetwork();
    }
  }

  drawNetwork(): void {
    if (!this.automaton || !this.networkContainer) return;

    const container = this.networkContainer.nativeElement;

    // Crear los nodos (estados)
    const nodes = new DataSet<Node>(
      this.automaton.states.map(state => {
        let shape = 'circle';
        let borderWidth = 1;

        if (state.isFinal) {
          shape = 'doublecircle';
          borderWidth = 3;
        }

        return {
          id: state.id,
          label: state.name,
          shape: shape,
          borderWidth: borderWidth,
          color: state.isInitial ? { background: '#d3e9ff' } : { background: '#ffffff' }
        };
      })
    );

    // Crear las conexiones (transiciones)
    const edges = new DataSet<Edge>(
      this.automaton.transitions.map((transition, index) => {
        // Verificar si ya existe una transición entre estos estados
        const existingTransition = this.automaton!.transitions.findIndex(t =>
          t.from === transition.from && t.to === transition.to && t !== transition
        );

        return {
          id: index.toString(),
          from: transition.from,
          to: transition.to,
          label: transition.symbol,
          arrows: 'to',
          smooth: existingTransition !== -1 ? { enabled: true, type: 'curvedCW', roundness: 0.2 } : true
        };
      })
    );

    // Opciones para el diagrama
    const options: Options = {
      physics: {
        enabled: true,
        barnesHut: {
          gravitationalConstant: -2000,
          centralGravity: 0.3,
          springLength: 150,
          springConstant: 0.04
        }
      },
      nodes: {
        shape: 'circle',
        size: 25,
        font: {
          size: 14
        }
      },
      edges: {
        font: {
          size: 14,
          align: 'middle'
        },
        width: 2
      }
    };

    // Crear el diagrama
    this.network = new Network(container, { nodes, edges }, options);
  }
}
