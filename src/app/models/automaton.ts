export interface State {
  id: string;
  name: string;
  isInitial?: boolean;
  isFinal?: boolean;
}

export interface Transition {
  from: string;
  to: string;
  symbol: string;
}

export interface Automaton {
  states: State[];
  alphabet: string[];
  transitions: Transition[];
}
