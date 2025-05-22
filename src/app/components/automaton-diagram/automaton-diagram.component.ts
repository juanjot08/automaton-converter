import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild, AfterViewInit } from '@angular/core';
import { Automaton } from '../../models/automaton';
import * as dagre from 'dagre';
import * as graphlib from 'graphlib';
// Importaciones directas de JointJS
import * as joint from 'jointjs';
// Importar dependencias necesarias manualmente
import 'jquery';
import 'backbone';

@Component({
  selector: 'app-automaton-diagram',
  templateUrl: './automaton-diagram.component.html',
  styleUrls: ['./automaton-diagram.component.scss']
})
export class AutomatonDiagramComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() automaton!: Automaton;
  @ViewChild('diagramContainer') diagramContainer!: ElementRef;

  private graph!: joint.dia.Graph;
  private paper: joint.dia.Paper | null = null;
  private stateElements: { [key: string]: joint.dia.Element } = {};

  constructor() { }

  ngOnInit(): void {
    // Ya no inicializamos JointJS aquí, sino en ngAfterViewInit
  }

  ngAfterViewInit(): void {
    // Esperar a que el DOM esté listo
    setTimeout(() => {
      this.initJointJS();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['automaton'] && this.automaton && this.paper) {
      console.log('Automaton changed:', this.automaton);
      this.drawAutomaton();
    }
  }

  private initJointJS(): void {
    if (!this.diagramContainer || !this.diagramContainer.nativeElement) {
      console.error('Container for JointJS not found');
      return;
    }

    const container = this.diagramContainer.nativeElement;

    // Inicializar el gráfico y el papel
    this.graph = new joint.dia.Graph();
    this.paper = new joint.dia.Paper({
      el: container,
      model: this.graph,
      width: '100%',
      height: '800px',
      gridSize: 1,
      drawGrid: true,
      interactive: true,
      background: {
        color: '#F8F9FA'
      },
      defaultConnectionPoint: { name: 'boundary' },
      defaultLink: new joint.shapes.standard.Link(),
    });

    console.log('JointJS initialized with paper:', this.paper);

    // Asegurarse de que el diagrama se redimensione con el contenedor
    window.addEventListener('resize', () => {
      if (this.paper && container) {
        this.paper.setDimensions(container.offsetWidth, container.offsetHeight);
      }
    });

    // Dibujar el autómata si existe
    if (this.automaton) {
      this.drawAutomaton();
    }
  }

  private drawAutomaton(): void {
    if (!this.graph || !this.paper || !this.automaton) {
      console.error('Cannot draw automaton: Graph, paper or automaton is missing');
      return;
    }

    console.log('Drawing automaton with states:', this.automaton.states.length);

    // Limpiar el gráfico anterior
    this.graph.clear();
    this.stateElements = {};

    // Crear los estados (nodos)
    this.automaton.states.forEach(state => {
      let stateElement: joint.dia.Element;

      const StateElement = joint.dia.Element.define('automaton.State', {
        attrs: {
          root: {
            magnet: false
          },
          circle: {
            stroke: '#333333',
            strokeWidth: 2,
            fill: state.isInitial ? '#d3e9ff' : '#ffffff'
          },
          label: {
            text: state.name,
            fill: '#333333',
            fontSize: 14,
            fontWeight: 'bold',
            pointerEvents: 'none',
            y: 0
          },
          '.outer-circle': {
            stroke: state.isFinal ? '#333333' : 'none',
            strokeWidth: state.isFinal ? 2 : 0,
            fill: 'none',
            r: 26
          },
          '.initial-label': {
            text: state.isInitial ? 'Inicio' : '',
            fill: '#333333',
            fontSize: 16,
            y: -40,
            display: state.isInitial ? 'block' : 'none'
          }
        }
      }, {
        markup: [
          { tagName: 'circle', selector: 'circle', attributes: { r: 20 } },
          { tagName: 'circle', selector: '.outer-circle', attributes: { r: 26 } },
          { tagName: 'text', selector: 'label' },
          { tagName: 'text', selector: '.initial-label' }
        ]
      });

      stateElement = new StateElement();

      // Calcular el tamaño del estado basado en el texto
      const textLength = state.name.length;
      const padding = 20; // Espacio adicional alrededor del texto
      const fontSize = 14; // Tamaño de fuente del texto
      const estimatedWidth = textLength * (fontSize / 2) + padding;

      stateElement.resize(estimatedWidth, estimatedWidth);

      // stateElement.position(10npm i --save-dev @types/graphlib0 + Math.random() * 400, 100 + Math.random() * 300);
      stateElement.attr('label/text', state.name);

      this.stateElements[state.id] = stateElement;
      stateElement.addTo(this.graph);
    });

    // Crear las transiciones (enlaces)
    this.automaton.transitions.forEach((transition) => {
      const sourceElement = this.stateElements[transition.from];
      const targetElement = this.stateElements[transition.to];

      if (!sourceElement || !targetElement) return;

      const link = new joint.shapes.standard.Link({
        source: { id: sourceElement.id },
        target: { id: targetElement.id },
        labels: [{
          position: 0.5,
          attrs: {
            text: {
              text: transition.symbol,
              fontSize: 14
            }
          }
        }],
        attrs: {
          line: {
            stroke: '#333333',
            strokeWidth: 2,
            targetMarker: {
              type: 'path',
              d: 'M 10 -5 0 0 10 5 Z'
            }
          }
        }
      });

      // Lógica para enlaces de bucle (self-loops)
      if (transition.from === transition.to) {
        link.source(sourceElement).target(targetElement);
        link.vertices([
          { x: sourceElement.position().x + 45, y: sourceElement.position().y - 60 }, // Punto de control 1
          { x: sourceElement.position().x - 45, y: sourceElement.position().y - 60 }  // Punto de control 2
        ]);
        link.connector('smooth'); // Usar conector suave para la curva
        link.prop('labels/0/position', 0.25); // Ajustar la posición de la etiqueta
      } else {
        // Lógica para transiciones bidireccionales o múltiples
        const existingLinksFromSource = this.graph.getConnectedLinks(sourceElement, { outbound: true });
        const existingLinksToTarget = this.graph.getConnectedLinks(targetElement, { inbound: true });

        const hasOpposite = existingLinksFromSource.some(l =>
          l.getTargetElement()?.id === sourceElement.id && l.getSourceElement()?.id === targetElement.id
        );
        const isMultiple = existingLinksFromSource.some(l =>
          l.getTargetElement()?.id === targetElement.id && l.getSourceElement()?.id === sourceElement.id && l.id !== link.id
        );

        if (hasOpposite) {
          // Para transiciones bidireccionales
          link.router('orthogonal');
          link.connector('smooth', {
            curviness: isMultiple ? 80 : 40 // Ajustar curviness si hay múltiples enlaces bidireccionales
          });
        } else if (isMultiple) {
          // Para múltiples transiciones en la misma dirección
          link.router('manhattan'); // Manhattan puede ayudar a separarlas
          link.connector('smooth', {
            curviness: 40 // Curvatura para separar enlaces múltiples
          });
        } else {
          // Para transiciones normales
          link.router('orthogonal'); // Usar router ortogonal por defecto
          link.connector('smooth');
        }
      }

      link.addTo(this.graph);
    });

    joint.layout.DirectedGraph.layout(this.graph.getCells(), {
      dagre: dagre,
      graphlib: graphlib,
      setLinkVertices: false,
      marginX: 10,
      marginY: 10,
      rankDir: 'LR',
      align: 'UR',
      rankSep: 120,
      edgeSep: 120,
      nodeSep: 120,
    });

    this.centerDiagram();
  }

  private centerDiagram(): void {
  if (!this.paper || !this.graph) return;

  const container = this.diagramContainer.nativeElement;
  const paperWidth = container.offsetWidth;
  const paperHeight = container.offsetHeight;

  // Obtener las dimensiones del gráfico
  const graphBBox = this.graph.getBBox(); // Bounding box del gráfico completo

  // Calcular el desplazamiento necesario para centrar el gráfico
  const offsetX = (paperWidth - graphBBox!.width) / 2 - graphBBox!.x;
  const offsetY = (paperHeight - graphBBox!.height) / 2 - graphBBox!.y;

  // Mover todos los elementos del gráfico para centrarlo
  this.graph.translate(offsetX, offsetY);
}
}
