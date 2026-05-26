import { act, renderHook } from "@testing-library/react-native";
import { useCalculatorEngine } from "../features/converter/hooks/use-calculator-engine";

describe("useCalculatorEngine - Init & Digits", () => {
  it("initializes with default value '0'", () => {
    const { result } = renderHook(() => useCalculatorEngine());
    expect(result.current.displayValue).toBe("0");
    expect(result.current.expression).toBe("");
  });

  it("initializes with a custom initial value", () => {
    const { result } = renderHook(() => useCalculatorEngine("150"));
    expect(result.current.displayValue).toBe("150");
  });

  it("appends digits correctly", () => {
    const { result } = renderHook(() => useCalculatorEngine("0"));

    act(() => {
      result.current.pressKey("7");
    });
    expect(result.current.displayValue).toBe("7");

    act(() => {
      result.current.pressKey("8");
    });
    expect(result.current.displayValue).toBe("78");
  });

  it("ignores leading duplicate zeros", () => {
    const { result } = renderHook(() => useCalculatorEngine("0"));

    act(() => {
      result.current.pressKey("0");
    });
    expect(result.current.displayValue).toBe("0");
  });

  it("supports decimal separator and prevents duplicates", () => {
    const { result } = renderHook(() => useCalculatorEngine("0"));

    act(() => {
      result.current.pressKey(".");
    });
    expect(result.current.displayValue).toBe("0.");

    act(() => {
      result.current.pressKey("5");
    });
    expect(result.current.displayValue).toBe("0.5");

    act(() => {
      result.current.pressKey(".");
    });
    expect(result.current.displayValue).toBe("0.5");

    act(() => {
      result.current.pressKey(",");
    });
    expect(result.current.displayValue).toBe("0.5");
  });

  it("clears state on 'C'", () => {
    const { result } = renderHook(() => useCalculatorEngine("10"));

    act(() => {
      result.current.pressKey("+");
    });
    act(() => {
      result.current.pressKey("5");
    });
    act(() => {
      result.current.pressKey("C");
    });
    expect(result.current.displayValue).toBe("0");
    expect(result.current.expression).toBe("");
  });
});

describe("useCalculatorEngine - Backspace, Sign & Percent", () => {
  it("handles backspace", () => {
    const { result } = renderHook(() => useCalculatorEngine("123"));

    act(() => {
      result.current.pressKey("⌫");
    });
    expect(result.current.displayValue).toBe("12");

    act(() => {
      result.current.pressKey("⌫");
    });
    expect(result.current.displayValue).toBe("1");

    act(() => {
      result.current.pressKey("⌫");
    });
    expect(result.current.displayValue).toBe("0");
  });

  it("toggles sign correctly", () => {
    const { result } = renderHook(() => useCalculatorEngine("42"));

    act(() => {
      result.current.pressKey("±");
    });
    expect(result.current.displayValue).toBe("-42");

    act(() => {
      result.current.pressKey("±");
    });
    expect(result.current.displayValue).toBe("42");
  });

  it("applies percentage correctly", () => {
    const { result } = renderHook(() => useCalculatorEngine("250"));

    act(() => {
      result.current.pressKey("%");
    });
    expect(result.current.displayValue).toBe("2.5");
  });
});

describe("useCalculatorEngine - Calculations & Precision", () => {
  it("performs addition correctly", () => {
    const { result } = renderHook(() => useCalculatorEngine("10"));

    act(() => {
      result.current.pressKey("+");
    });
    expect(result.current.displayValue).toBe("10");
    expect(result.current.expression).toBe("10 +");

    act(() => {
      result.current.pressKey("5");
    });
    expect(result.current.displayValue).toBe("5");
    expect(result.current.expression).toBe("10 + 5");

    act(() => {
      result.current.pressKey("OK");
    });
    expect(result.current.displayValue).toBe("15");
    expect(result.current.expression).toBe("");
  });

  it("performs multiplication with visual symbol", () => {
    const { result } = renderHook(() => useCalculatorEngine("5"));

    act(() => {
      result.current.pressKey("×");
    });
    expect(result.current.expression).toBe("5 ×");

    act(() => {
      result.current.pressKey("4");
    });
    expect(result.current.displayValue).toBe("4");

    act(() => {
      result.current.pressKey("✓");
    });
    expect(result.current.displayValue).toBe("20");
  });

  it("resolves float point inaccuracies (e.g. 0.1 + 0.2)", () => {
    const { result } = renderHook(() => useCalculatorEngine("0.1"));

    act(() => {
      result.current.pressKey("+");
    });
    act(() => {
      result.current.pressKey("0");
    });
    act(() => {
      result.current.pressKey(".");
    });
    act(() => {
      result.current.pressKey("2");
    });
    act(() => {
      result.current.pressKey("OK");
    });
    expect(result.current.displayValue).toBe("0.3");
  });

  it("chains calculations automatically", () => {
    const { result } = renderHook(() => useCalculatorEngine("10"));

    act(() => {
      result.current.pressKey("+");
    });
    act(() => {
      result.current.pressKey("2");
    });
    act(() => {
      result.current.pressKey("0");
    });
    act(() => {
      result.current.pressKey("-");
    });
    expect(result.current.displayValue).toBe("30");
    expect(result.current.expression).toBe("30 −");

    act(() => {
      result.current.pressKey("5");
    });
    act(() => {
      result.current.pressKey("OK");
    });
    expect(result.current.displayValue).toBe("25");
  });

  it("handles division by zero and displays Error", () => {
    const { result } = renderHook(() => useCalculatorEngine("10"));

    act(() => {
      result.current.pressKey("÷");
    });
    act(() => {
      result.current.pressKey("0");
    });
    act(() => {
      result.current.pressKey("OK");
    });
    expect(result.current.displayValue).toBe("Error");

    act(() => {
      result.current.pressKey("9");
    });
    expect(result.current.displayValue).toBe("9");
  });
});
