import { getResourceErrors } from "../src/";

test("it returns no errors with a simple resource", () => {
  const resource = {
    Type: "AWS::RDS::DBSecurityGroup",
    Condition: "Is-EC2-Classic",
    Properties: {
      DBSecurityGroupIngress: {
        EC2SecurityGroupName: { Ref: "WebServerSecurityGroup" }
      },
      GroupDescription: "database access"
    }
  };
  console.log(getResourceErrors(resource))
  expect(getResourceErrors(resource).length).toBe(0);
});
