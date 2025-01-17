import { BIG_INT_PRECISION_M } from "../consts/precisions";
import {
  bind,
  Money,
  RoundingModesType,
  RoundingModes,
  assert
} from "@easymoney/core";

import {
  BigIntMoneyBase,
  CreateMoney,
  BigIntInstance,
  BigIntPrivateInstance,
  BigIntMoneyInput
} from "./types";
import { BigIntCalculatorBase } from "../calculator";

import { convertValueToBigInt } from "../number/";

function construct(
  amount: BigIntMoneyInput["amount"],
  currency: BigIntMoneyInput["currency"],

  config: Config
): Money<bigint> {
  if (config && config.source) {
    // TODO: reimplement this code
    // @ts-ignore
    return { amount, currency };
  }

  switch (typeof amount) {
    case "string":
      const newValue = String(amount);
      const parts = newValue.match(/^(\+|\-)?([0-9]*)?(\.([0-9]*))?$/);

      if (!parts) {
        throw new TypeError(
          "Input string must follow the pattern (-)##.## or -##"
        );
      }

      const signPart: "-" | "+" | undefined = <undefined | "-">parts[1];
      const integerPart: string | undefined = parts[2];
      const fracPart: string | undefined = parts[4];

      let output: bigint;

      if (fracPart && BigInt(fracPart) !== 0n) {
        throw new TypeError(
          `The number ${amount} is not an  integer. It must be converted before passing it`
        );
      }

      if (integerPart === undefined) {
        output = 0n;
      } else {
        output = BigInt(integerPart) * BIG_INT_PRECISION_M;
      }

      if (signPart === "-") {
        output *= -1n;
      }
      return { amount: output, currency };
    case "bigint":
      // @ts-ignore
      return { amount: amount * BIG_INT_PRECISION_M, currency };
    case "number":
      // @ts-ignore
      if (!Number.isSafeInteger(amount)) {
        throw new TypeError(
          `The number ${amount} is not a "safe" integer. It must be converted before passing it`
        );
      }

      return { amount: BigInt(amount) * BIG_INT_PRECISION_M, currency };
    default:
      throw new TypeError("value must be a safe integer, bigint or string");
  }
}

type Config = { source?: boolean } | null;

function createBigIntMoneyFactory(
  calculator: BigIntCalculatorBase,
  roundindMode: RoundingModesType,
  config: Config,
  { amount, currency }: BigIntMoneyInput
) {
  const money = construct(amount, currency, config);
  const privateInstance = {
    calculator,
    instanceMoney: money,
    roundindMode
  } as BigIntPrivateInstance;

  // privateInstance.round = bind(round, privateInstance);

  // privateInstance.getSource = bind(getSource, privateInstance);

  const publicInstance = {} as BigIntMoneyBase;

  const instance: BigIntInstance = { privateInstance, publicInstance };

  publicInstance.add = bind(add, instance);
  publicInstance.getSource = bind(getSource, privateInstance);
  publicInstance.getAmount = bind(getAmount, privateInstance);
  publicInstance.getCurrency = bind(getCurrency, privateInstance);
  publicInstance.subtract = bind(subtract, instance);
  publicInstance.isSameCurrency = bind(isSameCurrency, publicInstance);
  publicInstance.equals = bind(equals, instance);
  publicInstance.compare = bind(compare, instance);
  publicInstance.greaterThan = bind(greaterThan, publicInstance);
  publicInstance.greaterThanOrEqual = bind(greaterThanOrEqual, publicInstance);
  publicInstance.lessThan = bind(lessThan, publicInstance);
  publicInstance.lessThanOrEqual = bind(lessThanOrEqual, publicInstance);
  publicInstance.multiply = bind(multiply, instance);
  publicInstance.divide = bind(divide, instance);
  publicInstance.allocate = bind(allocate, instance);
  publicInstance.allocateTo = bind(allocateTo, instance);

  // publicInstance.mod = bind(mod, instance);
  // publicInstance.absolute = bind(absolute, instance);
  // publicInstance.negative = bind(negative, instance);
  // publicInstance.isZero = bind(isZero, instance);
  // publicInstance.isPositive = bind(isPositive, instance);
  // publicInstance.isNegative = bind(isNegative, instance);
  // publicInstance.ratioOf = bind(ratioOf, instance);

  return publicInstance;
}

export function createBigIntMoneyUnit(
  calculator: BigIntCalculatorBase,
  roundingMode: RoundingModesType = RoundingModes.HALF_EVEN
): CreateMoney<BigIntMoneyInput, BigIntMoneyBase> {
  return createBigIntMoneyFactory.bind(null, calculator, roundingMode, null);
}

function getAmount(privateInstance: BigIntPrivateInstance) {
  return privateInstance.instanceMoney.amount / BIG_INT_PRECISION_M;
}

function getSource(privateInstance: BigIntPrivateInstance) {
  return privateInstance.instanceMoney.amount;
}

function getCurrency(privateInstance: BigIntPrivateInstance) {
  return privateInstance.instanceMoney.currency;
}

function add(instance: BigIntInstance, money: BigIntMoneyBase) {
  const { publicInstance, privateInstance } = instance;

  const { calculator, instanceMoney, roundindMode } = privateInstance;

  assertSameCurrency(publicInstance, money);

  const newAmount = calculator.add(instanceMoney.amount, money.getSource());

  return createBigIntMoneyFactory(
    privateInstance.calculator,
    roundindMode,
    { source: true },
    {
      amount: newAmount,
      currency: money.getCurrency()
    }
  );
}

function subtract(instance: BigIntInstance, money: BigIntMoneyBase) {
  const { publicInstance, privateInstance } = instance;

  const { calculator, instanceMoney, roundindMode } = privateInstance;

  assertSameCurrency(publicInstance, money);

  const newAmount = calculator.subtract(
    instanceMoney.amount,
    money.getSource()
  );

  return createBigIntMoneyFactory(
    privateInstance.calculator,
    roundindMode,
    { source: true },
    {
      amount: newAmount,
      currency: money.getCurrency()
    }
  );
}

// TODO: move to common core
function equals(moneyInstance: BigIntInstance, money: BigIntMoneyBase) {
  return (
    moneyInstance.publicInstance.isSameCurrency(money) &&
    moneyInstance.privateInstance.instanceMoney.amount === money.getSource()
  );
}

// TODO: move to common
function compare(instance: BigIntInstance, money: BigIntMoneyBase) {
  const { publicInstance, privateInstance } = instance;

  assertSameCurrency(publicInstance, money);

  return privateInstance.calculator.compare(
    privateInstance.instanceMoney.amount,
    money.getSource()
  );
}

// TODO: move to common
function greaterThan(publicInstance: BigIntMoneyBase, money: BigIntMoneyBase) {
  return publicInstance.compare(money) > 0;
}
// TODO: move to common
function greaterThanOrEqual(
  publicInstance: BigIntMoneyBase,
  money: BigIntMoneyBase
) {
  return publicInstance.compare(money) >= 0;
}
// TODO: move to common
function lessThan(publicInstance: BigIntMoneyBase, money: BigIntMoneyBase) {
  return publicInstance.compare(money) < 0;
}
// TODO: move to common
function lessThanOrEqual(
  publicInstance: BigIntMoneyBase,
  money: BigIntMoneyBase
) {
  return publicInstance.compare(money) <= 0;
}

// TODO: move to common core
function isSameCurrency(
  moneyInstance: BigIntMoneyBase,
  money: BigIntMoneyBase
): boolean {
  return moneyInstance.getCurrency() === money.getCurrency();
}

// TODO: move to common core
function assertSameCurrency(
  moneyInstance: BigIntMoneyBase,
  money: BigIntMoneyBase
) {
  assert(
    isSameCurrency(moneyInstance, money),
    new TypeError("Currencies must be identical")
  );
}

// TODO: move to common
function assertRoundingMode(roundingMode: any): asserts roundingMode {
  assert(
    [
      RoundingModes.CEILING,
      RoundingModes.DOWN,
      RoundingModes.FLOOR,
      RoundingModes.HALF_DOWN,
      RoundingModes.HALF_EVEN,
      RoundingModes.HALF_UP,
      RoundingModes.UP
    ].includes(roundingMode),
    new TypeError(
      "rounding mode should be one of RoundingModes.CEILING RoundingModes.DOWN RoundingModes.FLOOR RoundingModes.HALF_DOWN RoundingModes.HALF_EVEN RoundingModes.HALF_UP RoundingModes.UP"
    )
  );
}

function multiply(
  instance: BigIntInstance,
  multiplier: string | number | bigint,
  roundingMode: RoundingModesType = RoundingModes.HALF_EVEN
) {
  assertRoundingMode(roundingMode);

  const { publicInstance, privateInstance } = instance;

  const { calculator } = privateInstance;

  const newAmount = calculator.multiply(
    publicInstance.getSource(),
    multiplier,
    roundingMode
  );

  return createBigIntMoneyFactory(
    privateInstance.calculator,
    roundingMode,
    { source: true },
    {
      amount: newAmount,
      currency: publicInstance.getCurrency()
    }
  );
}

function divide(
  instance: BigIntInstance,
  divisor: string | number | bigint,
  roundingMode: RoundingModesType = RoundingModes.HALF_EVEN
) {
  assertRoundingMode(roundingMode);

  const { privateInstance, publicInstance } = instance;

  const { calculator } = privateInstance;

  const bigIntDivisor = convertValueToBigInt(divisor, roundingMode);

  const newAmount = calculator.divide(
    publicInstance.getSource(),
    bigIntDivisor,
    roundingMode
  );

  return createBigIntMoneyFactory(calculator, roundingMode, null, {
    amount: newAmount,
    currency: publicInstance.getCurrency()
  });
}

function allocate(instance: BigIntInstance, ratios: number[]) {
  if (ratios.length === 0) {
    throw new TypeError(
      "Cannot allocate to none, ratios cannot be an empty array"
    );
  }

  const { privateInstance, publicInstance } = instance;

  const { calculator } = privateInstance;

  const signeAmount = publicInstance.getAmount();

  let reminder = signeAmount;

  const results = [];

  const total = ratios.reduce((acc, val) => acc + val, 0);

  if (total <= 0) {
    throw new TypeError(
      "Cannot allocate to none, sum of ratios must be greater than zero"
    );
  }

  for (let i = 0; i < ratios.length; i++) {
    const ratio = ratios[i];

    const convertedRatio = !Number.isInteger(ratio)
      ? parseInt(String(ratio * 100), 10)
      : ratio;

    if (ratio < 0) {
      throw new TypeError(
        "Cannot allocate to none, ratio must be zero or positive"
      );
    }

    const share = calculator.share(
      signeAmount,
      BigInt(convertedRatio),
      BigInt(total)
    );

    results[i] = share;

    reminder = calculator.subtract(reminder, share);
  }

  if (calculator.compare(reminder, 0n) === 0) {
    return results.map(result =>
      createBigIntMoneyFactory(
        calculator,
        instance.privateInstance.roundindMode,
        null,
        {
          amount: result,
          currency: publicInstance.getCurrency()
        }
      )
    );
  }

  const fractions = ratios.map(ratio => {
    const share = (ratio / total) * Number(signeAmount);

    return share - Math.floor(share);
  });

  while (calculator.compare(reminder, 0n) > 0) {
    let index: number;

    if (fractions.length !== 0) {
      let array: number[] = [];

      fractions.forEach((fraction, fractIndex) => {
        if (fraction === Math.max(...fractions)) {
          array.push(fractIndex);
        }
      });

      index = array[0];
    } else {
      index = 0;
    }

    results[index] = calculator.add(results[index], 1n);

    reminder = calculator.subtract(reminder, 1n);

    fractions[index] = 0;
  }

  return results.map(result =>
    createBigIntMoneyFactory(
      calculator,
      instance.privateInstance.roundindMode,
      null,
      {
        amount: result,
        currency: publicInstance.getCurrency()
      }
    )
  );
}

function allocateTo(instance: BigIntInstance, n: number) {
  if (!Number.isInteger(n)) {
    throw new TypeError("Number of targets must be an integer");
  }

  if (n <= 0) {
    throw new TypeError(
      "Cannot allocate to none, target must be greater than zero"
    );
  }

  return instance.publicInstance.allocate(Array(n).fill(1));
}
