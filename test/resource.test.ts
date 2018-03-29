import { getErrors } from "../src/resource";

test("it returns no errors with a simple resource", () => {
  const resource = {
    Properties: {
      DBSecurityGroupIngress: [{CIDRIP: "test"}],
      GroupDescription: "database access"
    },
    Type: "AWS::RDS::DBSecurityGroup",
  };
  expect(getErrors(resource).length).toBe(0);
});

test("it finds an invalid resource type", () => {
  const resource = {
    Properties: {},
    Type: "AWS::SSM::NotAType",
  };
  expect(getErrors(resource).length).toBe(1);
});

test("it finds missing properties", () => {
  const resource = {
    Properties: {},
    Type: "AWS::SSM::Association"
  };
  expect(getErrors(resource).length).toBe(1);
});

test("it finds a missing property", () => {
  const resource = {
    Properties: {
      DBSecurityGroupIngress: [{CIDRIP: "test"}]
    },
    Type: "AWS::RDS::DBSecurityGroup",
  };
  expect(getErrors(resource).length).toBe(1);
});

test("it finds an unknown property", () => {
  const resource = {    
    Properties: {
      DBSecurityGroupIngress: [{CIDRIP: "test"}],
      GroupDescription: "database access",
      Invalid: {
        ImNotReal: 3
      }
    },
    Type: "AWS::RDS::DBSecurityGroup",
  };
  expect(getErrors(resource).length).toBe(1);
});

test("it finds an invalid property primitive: should be string", () => {
  const resource = { 
    Properties: {
      DBSecurityGroupIngress: [{CIDRIP: "test"}],
      GroupDescription: true // should be "database access"
    },
    Type: "AWS::RDS::DBSecurityGroup",
  };

  const resource2 = {
    Properties: {
      DBSecurityGroupIngress: [{CIDRIP: "test"}],
      GroupDescription: [true] // should be "database access"
    },
    Type: "AWS::RDS::DBSecurityGroup",
  };
  const resource3 = {
    Properties: {
      DBSecurityGroupIngress: [{CIDRIP: "test"}],
      GroupDescription: { test: true } // should be "database access"
    },
    Type: "AWS::RDS::DBSecurityGroup",
  };

  expect(getErrors(resource).length).toBe(1);
  expect(getErrors(resource2).length).toBe(1);
  expect(getErrors(resource3).length).toBe(1);
});

test("it finds an invalid property list of primitives", () => {
  const resource = {
    Properties: {
      AvailabilityZones: [1, 2, 3, 4, 5], // should be strings
      MaxSize: "5",
      MinSize: "1",
    },
    Type: "AWS::AutoScaling::AutoScalingGroup",
  };

  const resource2 = {
    Properties: {
      AvailabilityZones: true, // should be strings
      MaxSize: "5",
      MinSize: "1",
    },
    Type: "AWS::AutoScaling::AutoScalingGroup",
  };

  expect(getErrors(resource).length).toBe(5);
  expect(getErrors(resource2).length).toBe(1);
});

test("it finds an invalid property map of primitives", () => {
  const resource = {
    Properties: {
      Parameters: {
        test: true,
        test2: 6
      },
      TemplateURL: "http://test.com",
    },
    Type: "AWS::CloudFormation::Stack",
  };

  const resource2 = {
    Properties: {
      Parameters: true,
      TemplateURL: "http://test.com",
    },
    Type: "AWS::CloudFormation::Stack",
  };

  expect(getErrors(resource).length).toBe(2);
  expect(getErrors(resource2).length).toBe(1);
});

test("it finds an invalid typed property", () => {
  const resource = {
    Properties: {
      PolicyName: "test",
      PolicyType: "test",
      StepScalingPolicyConfiguration: true
    },
    Type: "AWS::ApplicationAutoScaling::ScalingPolicy",
  };

  expect(getErrors(resource).length).toBe(1);
});

test("it finds a typed property with invalid properties", () => {
  const resource = {
    Properties: {
      PolicyName: "test",
      PolicyType: "test",
      StepScalingPolicyConfiguration: {
        MetricAggregationType: true
      }
    },
    Type: "AWS::ApplicationAutoScaling::ScalingPolicy",
  };

  expect(getErrors(resource).length).toBe(1);
});

test("it finds an invalid typed property item in a list", () => {
  const resource = {
    Properties: {
      GroupDescription:
        "Enable HTTP access via port 80 locked down to the load balancer + SSH access",
      SecurityGroupIngress: [
        {
          CidrIp: "asdf",
          FromPort: "80",
          IpProtocol: true,
          ToPort: "80",
        },
        {
          CidrIp: "asdf",
          FromPort: "22",
          IpProtocol: "tcp",
          ToPort: "22",
        }
      ]
    },
    Type: "AWS::EC2::SecurityGroup",
  };

  expect(getErrors(resource).length).toBe(1);
});

test("it finds a missing property on a typed property item in a list", () => {
  const resource = {
    Properties: {
      GroupDescription:
        "Enable HTTP access via port 80 locked down to the load balancer + SSH access",
      SecurityGroupIngress: [
        {
          CidrIp: "asdf",
          FromPort: "80",
          ToPort: "80",
        },
        {
          CidrIp: "asdf",
          FromPort: "22",
          IpProtocol: "tcp",
          ToPort: "22",
        }
      ]
    },
    Type: "AWS::EC2::SecurityGroup",
  };
  expect(getErrors(resource).length).toBe(1);
});

test("it finds an invalid typed property item in a map", () => {
  const resource = {    
    Properties: {
      Name: "Test",
      Parameters: {
        Test: {
          ParameterValues: [true]
        }
      }
    },
    Type: "AWS::SSM::Association",
  };

  expect(getErrors(resource).length).toBe(1);
});
