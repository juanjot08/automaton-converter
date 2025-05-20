// automaton-table.component.ts
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Automaton, State, Transition } from '../../models/automaton';

@Component({
  selector: 'app-automaton-table',
  templateUrl: './automaton-table.component.html',
  styleUrls: ['./automaton-table.component.scss']
})
export class AutomatonTableComponent implements OnChanges {
  @Input() automaton!: Automaton; // Recibe el objeto autómata

  // Mapa para buscar transiciones: Map<id_estado_origen, Mapa<símbolo, array_de_ids_estado_destino>>
  // Usamos string[] para soportar múltiples destinos por si los datos lo permiten o se interpretan así
  transitionMap: Map<string, Map<string, string[]>> = new Map();
  // Mapa para buscar el objeto Estado por su ID: Map<id_estado, objeto_Estado>
  stateMap: Map<string, State> = new Map();

  // Este hook se llama cuando las propiedades de entrada cambian
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['automaton'] && this.automaton) {
      // Reconstruir los mapas cada vez que cambia el autómata
      this.buildMaps();
    }
  }

  // Construye los mapas de transiciones y estados para una búsqueda rápida
  private buildMaps(): void {
    this.transitionMap.clear(); // Limpiar mapa de transiciones anterior
    this.stateMap.clear(); // Limpiar mapa de estados anterior

    if (!this.automaton) return; // Salir si no hay autómata

    // 1. Construir el mapa de estados (ID -> Objeto Estado)
    if (this.automaton.states) {
      for (const state of this.automaton.states) {
        this.stateMap.set(state.id, state);
      }
    }

    // 2. Construir el mapa de transiciones (id_origen -> (símbolo -> array_de_ids_destino))
    // Agrupamos las transiciones si hay múltiples destinos para el mismo (origen, símbolo)
    if (this.automaton.transitions) {
      for (const transition of this.automaton.transitions) {
        // Si el estado de origen no está en el mapa principal, añadirlo
        if (!this.transitionMap.has(transition.from)) {
          this.transitionMap.set(transition.from, new Map());
        }
        const symbolMap = this.transitionMap.get(transition.from)!;
        // Si el símbolo no está en el mapa interno, añadir un array vacío
        if (!symbolMap.has(transition.symbol)) {
          symbolMap.set(transition.symbol, []);
        }
        // Añadir el ID del estado destino al array
        symbolMap.get(transition.symbol)!.push(transition.to);
      }
    }
  }

  // Método para obtener una cadena separada por comas de los NOMBRES de los estados de destino
  // para un ID de estado origen y un símbolo dados.
  // Retorna la cadena de nombres o '-' si no hay transición definida o estados destino válidos.
  getDestStateNames(currentStateId: string, symbol: string): string {
    const stateTransitions = this.transitionMap.get(currentStateId);
    if (stateTransitions) {
      const destStateIds = stateTransitions.get(symbol); // Esto es un string[]
      if (destStateIds && destStateIds.length > 0) {
        // Mapeamos los IDs de destino a objetos State, luego a nombres, filtramos los nulos y unimos con coma
        const destStateNames = destStateIds
          .map(id => this.stateMap.get(id)) // Obtenemos el objeto estado por su ID
          .filter(state => state != null) // Filtramos IDs que no corresponden a un estado existente
          .map(state => state!.name); // Obtenemos el nombre del estado (usamos ! porque ya filtramos nulos)

        // Si encontramos nombres válidos, los unimos; de lo contrario, retornamos '-'
        return destStateNames.length > 0 ? destStateNames.join(',') : '-';
      }
    }
    return '-'; // No hay transiciones definidas para este ID de estado y símbolo
  }
}
