---
id: add
title: add
hide_title: true
sidebar_label: add
---

# add

**Example**

```js

import { createBigIntCalculator } from '@easymoney/bigint-money';

const calculator = createBigIntCalculator();

const result = calculator.add(40n, 5n);
// => 45n

const result1 = calculator.add(BigInt(10), BigInt(8));
// => 18n

```