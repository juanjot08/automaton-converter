import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AutomatonService } from '../../services/automaton.service';
import { Automaton, State, Transition } from '../../models/automaton';

@Component({
  selector: 'app-automaton-input',
  templateUrl: './automaton-input.component.html',
  styleUrls: ['./automaton-input.component.scss']
})
export class AutomatonInputComponent implements OnInit {
  automatonForm!: FormGroup;
  isNonDeterministic = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private automatonService: AutomatonService
  ) { }

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.automatonForm = this.fb.group({
      states: this.fb.array([]),
      alphabet: ['', Validators.required],
      transitions: this.fb.array([])
    });

    // Agregar al menos un estado
    this.addState();
  }

  get statesFormArray(): FormArray {
    return this.automatonForm.get('states') as FormArray;
  }

  get transitionsFormArray(): FormArray {
    return this.automatonForm.get('transitions') as FormArray;
  }

  addState(): void {
    const stateForm = this.fb.group({
      id: ['q' + this.statesFormArray.length, Validators.required],
      name: ['q' + this.statesFormArray.length, Validators.required],
      isInitial: [this.statesFormArray.length === 0], // El primer estado es inicial por defecto
      isFinal: [false]
    });
    this.statesFormArray.push(stateForm);
  }

  removeState(index: number): void {
    this.statesFormArray.removeAt(index);
  }

  addTransition(): void {
    const transitionForm = this.fb.group({
      from: ['', Validators.required],
      to: ['', Validators.required],
      symbol: ['', Validators.required]
    });
    this.transitionsFormArray.push(transitionForm);
  }

  removeTransition(index: number): void {
    this.transitionsFormArray.removeAt(index);
  }

  onSubmit(): void {
    if (this.automatonForm.invalid) {
      this.errorMessage = 'Por favor, completa todos los campos requeridos.';
      return;
    }

    const formValues = this.automatonForm.value;

    // Convertir el alfabeto de string a array
    const alphabet = formValues.alphabet.split(',').map((s: string) => s.trim());

    const automaton: Automaton = {
      states: formValues.states,
      alphabet,
      transitions: formValues.transitions
    };

    this.isNonDeterministic = this.automatonService.isNonDeterministic(automaton);

    if (this.isNonDeterministic) {
      this.automatonService.setAutomaton(automaton);
      this.errorMessage = '';
    } else {
      this.errorMessage = 'El autómata ingresado es determinístico. Por favor, ingresa un autómata no determinístico.';
    }
  }

  convertToAFD(): void {
    const formValues = this.automatonForm.value;
    const alphabet = formValues.alphabet.split(',').map((s: string) => s.trim());

    const automaton: Automaton = {
      states: formValues.states,
      alphabet,
      transitions: formValues.transitions
    };

    this.automatonService.convertToAFD(automaton);
  }

  getStateOptions(): State[] {
    return this.statesFormArray.controls.map(control => control.value);
  }

  getAlphabetOptions(): string[] {
    const alphabetStr = this.automatonForm.get('alphabet')?.value || '';
    return alphabetStr.split(',').map((s: string) => s.trim()).filter((s: string) => s);
  }
}
