import { Injectable } from '@angular/core';
import { Automaton, State, Transition } from '../models/automaton';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AutomatonService {
  private automaton = new BehaviorSubject<Automaton | null>(null);
  automaton$ = this.automaton.asObservable();

  private afd = new BehaviorSubject<Automaton | null>(null);
  afd$ = this.afd.asObservable();

  constructor() { }

  setAutomaton(automaton: Automaton) {
    this.automaton.next(automaton);
  }

  // Verifica si el autómata es no determinístico
  isNonDeterministic(automaton: Automaton): boolean {
    // Verificamos transiciones con el mismo origen y símbolo pero diferentes destinos
    const transitionMap = new Map<string, Set<string>>();

    for (const transition of automaton.transitions) {
      const key = `${transition.from}:${transition.symbol}`;
      if (!transitionMap.has(key)) {
        transitionMap.set(key, new Set<string>());
      }
      transitionMap.get(key)?.add(transition.to);
    }

    // Si alguna transición tiene más de un estado destino para el mismo símbolo, es no determinístico
    for (const destinations of transitionMap.values()) {
      if (destinations.size > 1) {
        return true;
      }
    }

    // Verificamos si hay transiciones con símbolo vacío (epsilon)
    return automaton.transitions.some(t => t.symbol === 'ε' || t.symbol === '');
  }

  // Convierte un AFND a AFD
  convertToAFD(afnd: Automaton): Automaton {
    const afd: Automaton = {
      states: [],
      alphabet: [...afnd.alphabet].filter(symbol => symbol !== 'ε' && symbol !== ''),
      transitions: []
    };

    // Crear el estado de error
    const errorStateId = "error";
    afd.states.push({
      id: errorStateId,
      name: errorStateId,
      isInitial: false,
      isFinal: false
    });

    // Agregar transiciones desde el estado de error hacia sí mismo
    afd.alphabet.forEach(symbol => {
      afd.transitions.push({
        from: errorStateId,
        to: errorStateId,
        symbol
      });
    });

    // Obtener el conjunto de estados iniciales (incluir los alcanzables por ε-transiciones)
    const initialState = afnd.states.find(state => state.isInitial);
    if (!initialState) return afd;

    const epsilonClosure = new Map<string, Set<string>>();

    // Calculamos el ε-clausura para cada estado
    afnd.states.forEach(state => {
      epsilonClosure.set(state.id, this.getEpsilonClosure(state.id, afnd));
    });

    // Estado inicial del AFD es la ε-clausura del estado inicial del AFND
    const initialStateId = initialState.id;
    const initialStateSet = epsilonClosure.get(initialStateId) || new Set([initialStateId]);
    const initialStateNames = Array.from(initialStateSet).sort().join(',');

    afd.states.push({
      id: initialStateNames,
      name: initialStateNames,
      isInitial: true,
      isFinal: this.containsFinalState(initialStateSet, afnd)
    });

    // Lista de estados pendientes por procesar
    const pendingStates: Set<string>[] = [initialStateSet];
    const processedStates = new Set<string>([initialStateNames]);

    // Mientras haya estados pendientes
    while (pendingStates.length > 0) {
      const currentStateSet = pendingStates.shift()!;
      const currentStateName = Array.from(currentStateSet).sort().join(',');

      // Para cada símbolo del alfabeto
      for (const symbol of afd.alphabet) {
        // Obtener los estados alcanzables con este símbolo
        const nextStateSet = this.getNextStates(currentStateSet, symbol, afnd, epsilonClosure);

        // Si no hay estados alcanzables, redirigir al estado de error
        const nextStateName = nextStateSet.size > 0
          ? Array.from(nextStateSet).sort().join(',')
          : errorStateId;

        // Agregar la transición al AFD
        afd.transitions.push({
          from: currentStateName,
          to: nextStateName,
          symbol
        });

        // Si este estado no ha sido procesado, agregarlo a la lista de pendientes
        if (nextStateSet.size > 0 && !processedStates.has(nextStateName)) {
          processedStates.add(nextStateName);
          pendingStates.push(nextStateSet);

          // Agregar el nuevo estado al AFD
          afd.states.push({
            id: nextStateName,
            name: nextStateName,
            isInitial: false,
            isFinal: this.containsFinalState(nextStateSet, afnd)
          });
        }
      }
    }

    this.afd.next(afd);
    return afd;
  }

  // Obtiene la ε-clausura de un estado
  private getEpsilonClosure(stateId: string, automaton: Automaton): Set<string> {
    const closure = new Set<string>([stateId]);
    const stack = [stateId];

    while (stack.length > 0) {
      const currentId = stack.pop()!;

      // Buscar transiciones epsilon desde este estado
      const epsilonTransitions = automaton.transitions.filter(
        t => t.from === currentId && (t.symbol === 'ε' || t.symbol === '')
      );

      for (const transition of epsilonTransitions) {
        if (!closure.has(transition.to)) {
          closure.add(transition.to);
          stack.push(transition.to);
        }
      }
    }

    return closure;
  }

  // Obtiene los estados alcanzables desde un conjunto de estados con un símbolo
  private getNextStates(
    stateSet: Set<string>,
    symbol: string,
    automaton: Automaton,
    epsilonClosure: Map<string, Set<string>>
  ): Set<string> {
    const nextStates = new Set<string>();

    for (const stateId of stateSet) {
      // Buscar transiciones con este símbolo
      const transitions = automaton.transitions.filter(
        t => t.from === stateId && t.symbol === symbol
      );

      for (const transition of transitions) {
        // Agregar el estado destino y su ε-clausura
        const destClosure = epsilonClosure.get(transition.to) || new Set([transition.to]);
        for (const destState of destClosure) {
          nextStates.add(destState);
        }
      }
    }

    return nextStates;
  }

  // Verifica si un conjunto de estados contiene al menos un estado final
  private containsFinalState(stateSet: Set<string>, automaton: Automaton): boolean {
    const finalStates = automaton.states.filter(state => state.isFinal).map(state => state.id);
    return Array.from(stateSet).some(stateId => finalStates.includes(stateId));
  }
}
