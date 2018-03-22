import { getErrors } from "../src/resource";

test("it returns no errors with a simple resource", () => {
  const resource = {
    Type: "AWS::RDS::DBSecurityGroup",
    Properties: {
      DBSecurityGroupIngress: {
        EC2SecurityGroupName: { Ref: "WebServerSecurityGroup" }
      },
      GroupDescription: "database access"
    }
  };
  expect(getErrors(resource).length).toBe(0);
});

test("it finds a missing property", () => {
  const resource = {
    Type: "AWS::RDS::DBSecurityGroup",
    Properties: {
      DBSecurityGroupIngress: {
        EC2SecurityGroupName: { Ref: "WebServerSecurityGroup" }
      }
    }
  };
  expect(getErrors(resource).length).toBe(1);
});

test("it finds an unknown property", () => {
  const resource = {
    Type: "AWS::RDS::DBSecurityGroup",
    Properties: {
      DBSecurityGroupIngress: {
        EC2SecurityGroupName: { Ref: "WebServerSecurityGroup" }
      },
      GroupDescription: "database access",
      Invalid: {
        ImNotReal: 3
      }
    }
  };
  expect(getErrors(resource).length).toBe(1);
});

test("it finds an invalid property primitive: should be string", () => {
  const resource = {
    Type: "AWS::RDS::DBSecurityGroup",
    Properties: {
      DBSecurityGroupIngress: {
        EC2SecurityGroupName: { Ref: "WebServerSecurityGroup" }
      },
      GroupDescription: true //should be "database access"
    }
  };

  const resource2 = {
    Type: "AWS::RDS::DBSecurityGroup",
    Properties: {
      DBSecurityGroupIngress: {
        EC2SecurityGroupName: { Ref: "WebServerSecurityGroup" }
      },
      GroupDescription: [true] //should be "database access"
    }
  };
  const resource3 = {
    Type: "AWS::RDS::DBSecurityGroup",
    Properties: {
      DBSecurityGroupIngress: {
        EC2SecurityGroupName: { Ref: "WebServerSecurityGroup" }
      },
      GroupDescription: { test: true } //should be "database access"
    }
  };

  expect(getErrors(resource).length).toBe(1);
  expect(getErrors(resource2).length).toBe(1);
  expect(getErrors(resource3).length).toBe(1);
});

test("it finds an invalid property list of primitives", () => {
  const resource = {
    Type: "AWS::AutoScaling::AutoScalingGroup",
    Properties: {
      AvailabilityZones: [1,2,3,4,5], //should be strings
      MinSize: "1",
      MaxSize: "5"
    }
  };

  const resource2 = {
    Type: "AWS::AutoScaling::AutoScalingGroup",
    Properties: {
      AvailabilityZones: true, //should be strings
      MinSize: "1",
      MaxSize: "5"
    }
  };

  expect(getErrors(resource).length).toBe(1);
  expect(getErrors(resource2).length).toBe(1);
});

test("it finds an invalid property map of primitives", () => {
  const resource = {
    Type: "AWS::CloudFormation::Stack",
    Properties: {
      TemplateURL: "http://test.com",
      Parameters: {
        "test": 4,
        "test2": 5
      }
    }
  };

  const resource2 = {
    Type: "AWS::CloudFormation::Stack",
    Properties: {
      TemplateURL: "http://test.com",
      Parameters: true
    }
  };

  expect(getErrors(resource).length).toBe(1);
  expect(getErrors(resource2).length).toBe(1);
});

test("it finds an invalid typed property", () => {
  const resource = {
    Type: "AWS::ApplicationAutoScaling::ScalingPolicy",
    Properties: {
      PolicyName: "test",
      PolicyType: "test",
      StepScalingPolicyConfiguration: true
    }
  };

  expect(getErrors(resource).length).toBe(1);
});

test("it finds a typed property with invalid properties", () => {
  const resource = {
    Type: "AWS::ApplicationAutoScaling::ScalingPolicy",
    Properties: {
      PolicyName: "test",
      PolicyType: "test",
      StepScalingPolicyConfiguration: {
        MetricAggregationType: true
      }
    }
  };

  expect(getErrors(resource).length).toBe(1);
});