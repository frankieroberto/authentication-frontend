import { Construct } from "constructs";

import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as kms from "aws-cdk-lib/aws-kms";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { SecretValue } from "aws-cdk-lib";

interface GetParameterProps {
    parameterPrefix: string
}

export function getParameter(scope: Construct, name: string, props: GetParameterProps) {
    return ssm.StringParameter.valueForStringParameter(scope, 
        `${props.parameterPrefix}/${name}`);
}

export function getSecureParameter(scope: Construct, name: string, props: GetParameterProps) {
    return SecretValue.ssmSecure(`${props.parameterPrefix}/${name}`).toString()
}