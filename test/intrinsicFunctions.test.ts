import {
  doesPropertyExist,
  getGetAttError,
  isArrayReturningFunction,
  isIntrinsicFunction
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

test("that a resource's property's existence can be validated", () => {
  const resources = {
    TestResource: {
      Properties: { TestProperty: 234 },
      Type: "sdf"
    }
  };
  expect(doesPropertyExist(resources, "TestResource", "TestProperty")).toBe(
    true
  );
});

test("that a resource's missing property's existence can be validated", () => {
  const resources = {
    TestResource: {
      Properties: { TestProperty: 234 },
      Type: "test"
    }
  };
  expect(doesPropertyExist(resources, "TestResource", "NotATestProperty")).toBe(
    false
  );
});

test("getGetAttError: returns no errors in valid case", () => {
  const template = {
    Resources: {
      Test: {
        Properties: { Name: "test" },
        Type: "AWS::StepFunctions::StateMachine"
      }
    }
  };
  const getAtt = { "Fn::GetAtt": ["Test", "Name"] };
  expect(getGetAttError(template, getAtt, "String")).toBeFalsy();
});

test("getGetAttError: return an error when the resource doesn't exist", () => {
  const template = {
    Resources: {
      Test2: {
        Properties: { Name: "test" },
        Type: "AWS::StepFunctions::StateMachine"
      }
    }
  };
  const getAtt = { "Fn::GetAtt": ["Test", "Name"] };
  const error = getGetAttError(template, getAtt, "String");
  expect(error && error.type).toBe("MissingReferencedResource");
});

test("getGetAttError: return an error when the referenced property doesn't exist", () => {
  const template = {
    Resources: {
      Test: {
        Properties: { Nope: "test" },
        Type: "AWS::StepFunctions::StateMachine"
      }
    }
  };
  const getAtt = { "Fn::GetAtt": ["Test", "Name"] };
  const error = getGetAttError(template, getAtt, "String");
  expect(error && error.type).toBe("MissingReferencedProperty");
});

test("getGetAttError: return an error when the referenced property isn't in the resource's attributes spec", () => {
  const template = {
    Resources: {
      Test: {
        Properties: { Name: "test" },
        Type: "AWS::StepFunctions::StateMachine"
      }
    }
  };
  const getAtt = { "Fn::GetAtt": ["Test", "Nope"] };
  const error = getGetAttError(template, getAtt, "String");
  expect(error && error.type).toBe("InvalidResourceAttribute");
});

test("getGetAttError: return an error when the referenced property isn't the right type", () => {
  const template = {
    Resources: {
      Test: {
        Properties: { Name: "Name" },
        Type: "AWS::StepFunctions::StateMachine"
      }
    }
  };
  const getAtt = { "Fn::GetAtt": ["Test", "Name"] };
  const error = getGetAttError(template, getAtt, "Integer");
  expect(error && error.type).toBe("InvalidResourceAttributeType");
});

test("getGetAttError: return an error when Fn:GetAtt uses an intrinsic function in the resource name", () => {
  const template = {
    Resources: {
      Test: {
        Properties: { Name: "test" },
        Type: "AWS::StepFunctions::StateMachine"
      }
    }
  };
  const getAtt = { "Fn::GetAtt": [{ Ref: "NotReal" }, "Name"] };
  const error = getGetAttError(template, getAtt, "String");
  expect(error && error.type).toBe("ImproperIntrinsicFunctionUsage");
});

test("getGetAttError: return an error when Fn:GetAtt uses an intrinsic function other than ref in the attribute name", () => {
  const template = {
    Resources: {
      Test: {
        Properties: { Name: "test" },
        Type: "AWS::StepFunctions::StateMachine"
      }
    }
  };
  const getAtt = { "Fn::GetAtt": ["Test", { "Fn::GetAtt": ["tes", "asd"] }] };
  const error = getGetAttError(template, getAtt, "String");
  expect(error && error.type).toBe("ImproperIntrinsicFunctionUsage");
});

test("getGetAttError: return an error when Fn:GetAtt has the wrong types as args", () => {
  const template = {
    Resources: {
      Test: {
        Properties: { Name: "test" },
        Type: "AWS::StepFunctions::StateMachine"
      }
    }
  };
  const getAtt = { "Fn::GetAtt": ["Test", 234] };
  const error = getGetAttError(template, getAtt, "String");
  expect(error && error.type).toBe("ImproperIntrinsicFunctionUsage");
});