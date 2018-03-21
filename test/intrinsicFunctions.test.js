import {
  isIntrinsicFunction,
  isArrayReturningFunction
} from "../src/intrinsicFunctions";

const fnKeys = [
  "Fn::Base64",
  "Fn::Cidr",
  "Fn::FindInMap",
  "Fn::GetAtt",
  "Fn::GetAZs",
  "Fn::ImportValue",
  "Fn::Join",
  "Fn::Select",
  "Fn::Split",
  "Fn::Sub",
  "Fn::And",
  "Fn::Equals",
  "Fn::If",
  "Fn::Not",
  "Fn::Or",
  "Ref"
];

test("discovers all intrinsic functions", () => {
  const fns = fnKeys.map(key => ({ [key]: true }));
  fns.forEach(fn => {
    expect(isIntrinsicFunction(fn)).toBe(true);
  });
});

test("rejects non-intrinsic function", () => {
  expect(isIntrinsicFunction({ test: {} })).toBe(false);
});

const arrayReturningFunctionKeys = ["Fn::GetAZs", "Fn::Split"];

test("finds array returning functions", () => {
  const fns = arrayReturningFunctionKeys.map(key => ({ [key]: true }));
  fns.forEach(fn => {
    expect(isArrayReturningFunction(fn)).toBe(true);
  });
});

test("rejects non array returning function", () => {
  expect(isArrayReturningFunction({ Ref: 54 })).toBe(false);
});
