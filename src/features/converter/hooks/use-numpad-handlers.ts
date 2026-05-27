import { useRouter } from "expo-router";

export function useNumpadHandlers(
  amount: string,
  updateAmount: (val: string) => void,
) {
  const router = useRouter();

  const onTapDigit = (d: string) => {
    const current = amount || "";
    let next: string;
    if (current === "0" || current === "") {
      next = d === "00" ? "0" : d;
    }
    else {
      next = `${current}${d}`;
    }
    const digitsOnly = next.replace(/\D/g, "");
    if (digitsOnly.length <= 10) {
      updateAmount(next);
    }
  };

  const onTapDot = () => {
    const current = amount || "";
    if (current === "") {
      updateAmount("0.");
    }
    else if (!current.includes(".")) {
      updateAmount(`${current}.`);
    }
  };

  const onTapBackspace = () => {
    const current = amount || "";
    if (current.length > 0) {
      updateAmount(current.slice(0, -1));
    }
  };

  const onTapClear = () => {
    updateAmount("");
  };

  const onTapOperator = (op: string) => {
    router.push({
      pathname: "/calculator",
      params: { operator: op },
    });
  };

  const onTapDone = () => {
    if (!amount) {
      return;
    }
    const parsed = Number.parseFloat(amount);
    if (!Number.isNaN(parsed)) {
      updateAmount(String(parsed));
    }
  };

  return {
    onTapDigit,
    onTapDot,
    onTapBackspace,
    onTapClear,
    onTapOperator,
    onTapDone,
  };
}
