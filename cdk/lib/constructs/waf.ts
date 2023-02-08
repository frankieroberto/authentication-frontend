import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as waf from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

interface WafProps {
  loadbalancer: elb.BaseLoadBalancer;
  logGroup: logs.ILogGroup;
}

export class Waf extends Construct {
  constructor(scope: Construct, id: string, props: WafProps) {
    super(scope, id);

    const acl = new waf.CfnWebACL(this, 'waf', {
      scope: 'REGIONAL',

      defaultAction: {
        allow: {}
      },
      rules: [
        {
          action: {
            block: {}
          },
          priority: 1,
          name: 'frontend-alb-waf-rate-based-rule',
          statement: {
            rateBasedStatement: {
              limit: 5000,
              aggregateKeyType: 'IP'
            }
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'FrontendAlbWafMaxRequestRate',
            sampledRequestsEnabled: true
          }
        },
        {
          overrideAction: {
            none: {}
          },
          priority: 2,
          name: 'frontend-alb-common-rule-set',
          statement: {
            managedRuleGroupStatement: {
              name: 'AWSManagedRulesCommonRuleSet',
              vendorName: 'AWS',

              excludedRules: [
                { name: 'GenericRFI_QUERYARGUMENTS' },
                { name: 'GenericRFI_BODY' }
              ]
            }
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'FrontendAlbWafCommonRuleSet',
            sampledRequestsEnabled: true
          }
        },
        {
          overrideAction: {
            none: {}
          },
          priority: 3,
          name: 'frontend-alb-bad-rule-set',
          statement: {
            managedRuleGroupStatement: {
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
              vendorName: 'AWS'
            }
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'FrontendAlbWafBaduleSet',
            sampledRequestsEnabled: true
          }
        }
      ],

      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: 'FrontendAlbWafRules',
        sampledRequestsEnabled: true
      }
    });

    new waf.CfnWebACLAssociation(this, 'waf-association', {
      resourceArn: props.loadbalancer.loadBalancerArn,
      webAclArn: acl.attrArn
    });

    new waf.CfnLoggingConfiguration(this, 'logging-configuration', {
      logDestinationConfigs: [props.logGroup.logGroupArn],
      resourceArn: acl.attrArn,
      loggingFilter: {
        DefaultBehavior: 'DROP',
        Filters: [
          {
            Behaviour: 'DROP',
            Conditions: [
              {
                ActionCondition: {
                  Action: 'BLOCK'
                }
              }
            ],
            Requirement: 'MEETS_ANY'
          }
        ]
      }
    });
  }
}
