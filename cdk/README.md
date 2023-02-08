# Authentication Frontend CDK

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

## Parameters

### SSM Parameter Store

* /frontend/minCapacity
* /frontend/maxCapacity
* /frontend/memoryTarget
* /frontend/cpuTarget
* /frontend/scaleInCooldown
* /frontend/scaleOutCooldown

### Secrets Manager

* /frontend/apiKey
* /frontend/sessionSecret
* /frontend/sessionExpiry
* /frontend/gtmId
* /frontend/zendeskApiToken
* /frontend/zendeskGroupIdPublic
* /frontend/zendeskUsername
