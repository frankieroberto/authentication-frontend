import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
import { LoadBalancer } from '../constructs/loadbalancer';
import { TaskDefinition } from '../constructs/taskdefinition';
import { Waf } from '../constructs/waf';
import { Redis } from '../constructs/redis';
import { AutoScaling } from '../constructs/autoscaling';

export class FrontendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const environment = new cdk.CfnParameter(this, 'environment', {
      default: 'build'
    }).valueAsString;

    new cdk.CfnCondition(this, 'isProd', {
      expression: cdk.Fn.conditionEquals(environment, 'production')
    });

    const vpc = new ec2.Vpc(this, 'vpc');

    const rootName = 'account.gov.uk';
    const domainName = cdk.Fn.conditionIf(
      'isProd',
      rootName,
      `${environment}.${rootName}`
    ).toString();
    const accountManagementFqdn = `manage.${domainName}`;
    const frontendApiFqdn = `auth.${domainName}`;
    const apiFqdn = `oidc.${domainName}`;
    const frontendFqdn = `signin.${domainName}`;

    const zone = new route53.PublicHostedZone(this, 'id', {
      zoneName: frontendFqdn,
      comment: 'Hosted zone for Authentication Frontend'
    });

    const loadbalancer = new LoadBalancer(this, 'loadbalancer', {
      vpc,
      zone
    });

    const logGroupKey = new kms.Key(this, 'loggroup-key', {
      enableKeyRotation: true
    });
    const logGroup = new logs.LogGroup(this, 'loggroup', {
      logGroupName: '/ecs/frontend',
      encryptionKey: logGroupKey
    });
    new logs.CfnSubscriptionFilter(this, 'loggroup-splunk', {
      destinationArn:
        'arn:aws:logs:eu-west-2:885513274347:destination:csls_cw_logs_destination_prodpython',
      filterPattern: '',
      logGroupName: logGroup.logGroupName
    });

    logGroup.addMetricFilter('all-get-requests-with-language-dimension', {
      metricName: 'all-get-requests-with-language-dimension',
      metricNamespace: 'Authentication',
      filterPattern: logs.FilterPattern.literal(
        '{$.req.method = "GET" && $.req.url != "/healthcheck/"}'
      ),
      dimensions: {
        language: '$.res.languageFromCookie'
      }
    });

    logGroup.addMetricFilter('language-change-events', {
      metricName: 'language-change-events',
      metricNamespace: 'Authentication',
      filterPattern: logs.FilterPattern.literal(
        '{$.req.method = "GET" && $.req.url = "*lng=" && $.req.url != "/healthcheck/"}'
      ),
      dimensions: {
        language: '$.res.languageFromCookie',
        urlPath: '$.req.url'
      }
    });

    const wafLogGroup = new logs.LogGroup(this, 'waf-loggroup', {
      logGroupName: 'aws-waf-logs-frontend-alb',
      encryptionKey: logGroupKey
    });
    new logs.CfnSubscriptionFilter(this, 'waf-loggroup-splunk', {
      destinationArn:
        'arn:aws:logs:eu-west-2:885513274347:destination:csls_cw_logs_destination_prodpython',
      filterPattern: '',
      logGroupName: wafLogGroup.logGroupName
    });

    new Waf(this, 'waf', {
      loadbalancer,
      logGroup: wafLogGroup
    });

    const redis = new Redis(this, 'redis', {
      vpc
    });

    const cluster = new ecs.Cluster(this, 'cluster', {
      vpc
    });

    const taskDefinition = new TaskDefinition(this, 'taskdefinition', {
      environment,
      apiFqdn,
      accountManagementFqdn,
      frontendApiFqdn,
      frontendFqdn,
      serviceDomain: domainName,
      vpc,
      logGroup,

      redisHost: redis.host,
      redisPort: redis.port,
      redisPassword: redis.password
    });

    const service = new ecs.FargateService(this, 'service', {
      cluster,
      taskDefinition
    });
    loadbalancer.targetGroup.addTarget(service);

    new AutoScaling(this, 'autoscaling', {
      service,
      cluster
    });
  }
}
