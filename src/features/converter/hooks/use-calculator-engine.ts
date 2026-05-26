import * as React from "react";

export type CalculatorKey
  = | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
    | "." | ","
    | "+" | "-" | "*" | "/" | "×" | "÷" | "−"
    | "%"
    | "±"
    | "C"
    | "⌫"
    | "OK" | "✓";

type CalculatorState = {
  displayValue: string;
  previousValue: string | null;
  operation: string | null;
  isWaitingForNewInput: boolean;
};

type CalculatorAction
  = | { type: "PRESS_KEY"; key: CalculatorKey }
    | { type: "RESET"; payload: string };

function mapOperator(op: string): string {
  switch (op) {
    case "×":
      return "*";
    case "÷":
      return "/";
    case "−":
      return "-";
    default:
      return op;
  }
}

function displayOperator(op: string): string {
  switch (op) {
    case "*":
      return "×";
    case "/":
      return "÷";
    case "-":
      return "−";
    default:
      return op;
  }
}

function cleanFloat(val: number): string {
  if (Number.isNaN(val) || !Number.isFinite(val)) {
    return "Error";
  }
  const str = val.toFixed(10);
  if (str.includes(".")) {
    return str.replace(/\.?0+$/, "");
  }
  return str;
}

export function evaluate(prev: string, curr: string, op: string): string {
  const prevNum = Number.parseFloat(prev);
  const currNum = Number.parseFloat(curr);
  if (Number.isNaN(prevNum) || Number.isNaN(currNum)) {
    return curr;
  }
  let result = 0;
  switch (op) {
    case "+":
      result = prevNum + currNum;
      break;
    case "-":
      result = prevNum - currNum;
      break;
    case "*":
      result = prevNum * currNum;
      break;
    case "/":
      if (currNum === 0) {
        return "Error";
      }
      result = prevNum / currNum;
      break;
    default:
      return curr;
  }
  return cleanFloat(result);
}

function handleDigit(state: CalculatorState, key: string): CalculatorState {
  const { displayValue, isWaitingForNewInput } = state;
  if (isWaitingForNewInput) {
    return { ...state, displayValue: key, isWaitingForNewInput: false };
  }
  if (displayValue === "0") {
    return { ...state, displayValue: key };
  }
  return { ...state, displayValue: displayValue + key };
}

function handleDecimal(state: CalculatorState): CalculatorState {
  const { displayValue, isWaitingForNewInput } = state;
  if (isWaitingForNewInput) {
    return { ...state, displayValue: "0.", isWaitingForNewInput: false };
  }
  if (displayValue.includes(".")) {
    return state;
  }
  return { ...state, displayValue: `${displayValue}.` };
}

function handleBackspace(state: CalculatorState): CalculatorState {
  const { displayValue, isWaitingForNewInput } = state;
  if (isWaitingForNewInput) {
    return state;
  }
  if (displayValue.length > 1) {
    const next = displayValue.slice(0, -1);
    if (next === "-") {
      return { ...state, displayValue: "0" };
    }
    return { ...state, displayValue: next };
  }
  return { ...state, displayValue: "0" };
}

function handleSign(state: CalculatorState): CalculatorState {
  const { displayValue } = state;
  if (displayValue === "0") {
    return state;
  }
  if (displayValue.startsWith("-")) {
    return { ...state, displayValue: displayValue.slice(1) };
  }
  return { ...state, displayValue: `-${displayValue}` };
}

function handlePercent(state: CalculatorState): CalculatorState {
  const { displayValue } = state;
  const val = Number.parseFloat(displayValue);
  return { ...state, displayValue: cleanFloat(val / 100) };
}

function handleOperator(state: CalculatorState, key: string): CalculatorState {
  const { displayValue, previousValue, operation, isWaitingForNewInput } = state;
  const standardOp = mapOperator(key);
  if (operation !== null && previousValue !== null && !isWaitingForNewInput) {
    const result = evaluate(previousValue, displayValue, operation);
    if (result === "Error") {
      return {
        displayValue: "Error",
        previousValue: null,
        operation: null,
        isWaitingForNewInput: true,
      };
    }
    return {
      displayValue: result,
      previousValue: result,
      operation: standardOp,
      isWaitingForNewInput: true,
    };
  }
  return {
    ...state,
    previousValue: displayValue,
    operation: standardOp,
    isWaitingForNewInput: true,
  };
}

function handleEvaluate(state: CalculatorState): CalculatorState {
  const { displayValue, previousValue, operation } = state;
  if (operation !== null && previousValue !== null) {
    const result = evaluate(previousValue, displayValue, operation);
    return {
      displayValue: result,
      previousValue: null,
      operation: null,
      isWaitingForNewInput: true,
    };
  }
  return state;
}

function calculatorReducer(state: CalculatorState, action: CalculatorAction): CalculatorState {
  if (action.type === "RESET") {
    return {
      displayValue: action.payload,
      previousValue: null,
      operation: null,
      isWaitingForNewInput: false,
    };
  }

  const { key } = action;
  if (key === "C") {
    return {
      displayValue: "0",
      previousValue: null,
      operation: null,
      isWaitingForNewInput: false,
    };
  }

  if (state.displayValue === "Error") {
    if (["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(key)) {
      return {
        displayValue: key,
        previousValue: null,
        operation: null,
        isWaitingForNewInput: false,
      };
    }
    if (key === "." || key === ",") {
      return {
        displayValue: "0.",
        previousValue: null,
        operation: null,
        isWaitingForNewInput: false,
      };
    }
    return state;
  }

  if (["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(key)) {
    return handleDigit(state, key);
  }
  if (key === "." || key === ",") {
    return handleDecimal(state);
  }
  if (key === "⌫") {
    return handleBackspace(state);
  }
  if (key === "±") {
    return handleSign(state);
  }
  if (key === "%") {
    return handlePercent(state);
  }
  if (["+", "-", "*", "/", "×", "÷", "−"].includes(key)) {
    return handleOperator(state, key);
  }
  if (key === "OK" || key === "✓") {
    return handleEvaluate(state);
  }

  return state;
}

export function useCalculatorEngine(initialValue: string = "0") {
  const [state, dispatch] = React.useReducer(calculatorReducer, {
    displayValue: initialValue,
    previousValue: null,
    operation: null,
    isWaitingForNewInput: false,
  });

  const lastInitialValue = React.useRef(initialValue);
  if (lastInitialValue.current !== initialValue) {
    lastInitialValue.current = initialValue;
    dispatch({ type: "RESET", payload: initialValue });
  }

  const pressKey = React.useCallback((key: CalculatorKey) => {
    dispatch({ type: "PRESS_KEY", key });
  }, []);

  const expression = React.useMemo(() => {
    const { previousValue, operation, isWaitingForNewInput, displayValue } = state;
    if (previousValue !== null && operation !== null) {
      const opSymbol = displayOperator(operation);
      if (isWaitingForNewInput) {
        return `${previousValue} ${opSymbol}`;
      }
      return `${previousValue} ${opSymbol} ${displayValue}`;
    }
    return "";
  }, [state]);

  return {
    displayValue: state.displayValue,
    previousValue: state.previousValue,
    operation: state.operation,
    expression,
    pressKey,
  };
}
