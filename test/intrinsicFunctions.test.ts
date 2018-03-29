import {
  doesPropertyExist,
  getIntrinsicError,
  isArrayReturningFunction,
  isIntrinsicFunction
} from "../src/intrinsicFunctions";
import getGetAttError from "../src/intrinsicFunctions/validators/getAtt";
import getRefError from "../src/intrinsicFunctions/validators/ref";

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
  expect(
    getGetAttError(
      getAtt,
      { Required: true, PrimitiveType: "String" },
      template
    )
  ).toBeFalsy();
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
  const error = getGetAttError(
    getAtt,
    { Required: true, PrimitiveType: "String" },
    template
  );
  expect(error && error.type).toBe("MissingReferencedResource");
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
  const error = getGetAttError(
    getAtt,
    { Required: true, PrimitiveType: "String" },
    template
  );
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
  const error = getGetAttError(
    getAtt,
    { Required: true, PrimitiveType: "Integer" },
    template
  );
  expect(error && error.type).toBe("InvalidResourceAttributeType");
});

test("getGetAttError: does not return an error when the referenced property is a list of the right type", () => {
  const template = {
    Resources: {
      Test: {
        Properties: { Name: "Name" },
        Type: "AWS::DirectoryService::MicrosoftAD"
      }
    }
  };
  const getAtt = { "Fn::GetAtt": ["Test", "DnsIpAddresses"] };
  const spec = {
    PrimitiveItemType: "String",
    Required: false,
    Type: "List"
  };
  const error = getGetAttError(getAtt, spec, template);
  expect(error).toBeFalsy();
});

test("getGetAttError: returns an error when the referenced property is not a list of the right type", () => {
  const template = {
    Resources: {
      Test: {
        Properties: { Name: "Name" },
        Type: "AWS::DirectoryService::MicrosoftAD"
      }
    }
  };
  const getAtt = { "Fn::GetAtt": ["Test", "DnsIpAddresses"] };
  const spec = {
    PrimitiveItemType: "String",
    Required: false,
    Type: "List"
  };
  const error = getGetAttError(getAtt, spec, template);
  expect(error).toBeFalsy();
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
  const error = getGetAttError(
    getAtt,
    { Required: true, PrimitiveType: "String" },
    template
  );
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
  const error = getGetAttError(
    getAtt,
    { Required: true, PrimitiveType: "String" },
    template
  );
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
  const error = getGetAttError(
    getAtt,
    { Required: true, PrimitiveType: "String" },
    template
  );
  expect(error && error.type).toBe("ImproperIntrinsicFunctionUsage");
});

test("getRefError: return no errors in a valid case", () => {
  const template = {
    Resources: {
      Test: {
        Properties: {},
        Type: "AWS::StepFunctions::StateMachine"
      }
    }
  };
  const ref = { Ref: "Test" };
  expect(
    getRefError(ref, { Required: true, PrimitiveType: "String" }, template)
  ).toBeFalsy();
});

test("getRefError: finds illegal use of a sub function", () => {
  const template = {
    Resources: {
      Test: {
        Properties: {},
        Type: "AWS::StepFunctions::StateMachine"
      }
    }
  };
  const ref = { Ref: { Ref: "test" } };
  const error = getRefError(
    ref,
    { Required: true, PrimitiveType: "String" },
    template
  );
  expect(error && error.type).toBe("ImproperIntrinsicFunctionUsage");
});

test("getRefError: finds illegal use of a sub function", () => {
  const template = {
    Resources: {
      Test: {
        Properties: {},
        Type: "AWS::StepFunctions::StateMachine"
      }
    }
  };
  const ref = { Ref: { Ref: "test" } };
  const error = getRefError(
    ref,
    { Required: true, PrimitiveType: "String" },
    template
  );
  expect(error && error.type).toBe("ImproperIntrinsicFunctionUsage");
});

test("getRefError: finds wrong type in ref resource name argument", () => {
  const template = {
    Resources: {
      Test: {
        Properties: {},
        Type: "AWS::StepFunctions::StateMachine"
      }
    }
  };
  const ref = { Ref: 122359 };
  const error = getRefError(
    ref,
    { Required: true, PrimitiveType: "String" },
    template
  );
  expect(error && error.type).toBe("ImproperIntrinsicFunctionUsage");
});

test("getRefError: finds a missing resource error", () => {
  const template = {
    Resources: {
      Test: {
        Properties: {},
        Type: "AWS::StepFunctions::StateMachine"
      }
    }
  };
  const ref = { Ref: "NotReal" };
  const error = getRefError(
    ref,
    { Required: true, PrimitiveType: "String" },
    template
  );
  expect(error && error.type).toBe("MissingReferencedResource");
});

test("getRefError: finds a missing resource error", () => {
  const template = {
    Resources: {
      Test: {
        Properties: {},
        Type: "AWS::StepFunctions::StateMachine"
      }
    }
  };
  const ref = { Ref: "NotReal" };
  const error = getRefError(
    ref,
    { Required: true, PrimitiveType: "String" },
    template
  );
  expect(error && error.type).toBe("MissingReferencedResource");
});

test("getIntrinsicError: finds missing reference", () => {
  const template = {
    Resources: {
      Test: {
        Properties: {},
        Type: "AWS::StepFunctions::StateMachine"
      }
    }
  };
  const ref = { Ref: "NotReal" };
  const error = getIntrinsicError(
    ref,
    { Required: true, PrimitiveType: "String" },
    template
  );
  expect(error && error.type).toBe("MissingReferencedResource");
});

test("getIntrinsicError: finds a nested missing reference", () => {
  const template = {
    Resources: {
      Test: {
        Properties: {
          Name: "This"
        },
        Type: "AWS::StepFunctions::StateMachine"
      }
    }
  };
  const ref = { "Fn::GetAtt": ["Test", { "Ref": "Test2" }] };
  const error = getIntrinsicError(
    ref,
    { Required: true, PrimitiveType: "String" },
    template
  );

  expect(error && error.type).toBe("MissingReferencedResource");

  const ref2 = { "Fn::Split": [",", { "Fn::GetAtt": ["Test", { "Ref": "Test2" }] }] };
  const error2 = getIntrinsicError(
    ref,
    { Type: "List", PrimitiveItemType: "String" },
    template
  );

  expect(error2 && error2.type).toBe("MissingReferencedResource");
});

test("getIntrinsicError: finds a Fn::Sub nested error", () => {
  const template = {
    Resources: {
      Test: {
        Properties: {
          Name: "This"
        },
        Type: "AWS::StepFunctions::StateMachine"
      }
    }
  };
  // tslint:disable-next-line:no-invalid-template-strings
  const ref = { "Fn::Sub": ["replacement string ${test}", { "test": { "Ref": "Test2" } }] };
  const error = getIntrinsicError(
    ref,
    { Required: true, PrimitiveType: "String" },
    template
  );

  expect(error && error.type).toBe("MissingReferencedResource");
});