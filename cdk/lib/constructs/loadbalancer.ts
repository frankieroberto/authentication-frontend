import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';
import { readFileSync } from 'fs';

interface LoadbalancerProps {
  vpc: ec2.IVpc;
  zone: route53.IHostedZone;
}

export class LoadBalancer extends elb.ApplicationLoadBalancer {
  public readonly httpsListener: elb.ApplicationListener;
  public readonly targetGroup: elb.ApplicationTargetGroup;

  constructor(scope: Construct, id: string, props: LoadbalancerProps) {
    super(scope, id, {
      ...props,
      vpc: props.vpc,
      internetFacing: true,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC
      }
    });

    this.addRedirect();

    const aRecord = new route53.ARecord(this, 'aRecord', {
      zone: props.zone,
      target: route53.RecordTarget.fromAlias(
        new targets.LoadBalancerTarget(this)
      )
    });

    const domainName = aRecord.domainName;

    const certificate = new acm.Certificate(this, 'certificate', {
      domainName: domainName,
      validation: acm.CertificateValidation.fromDns(props.zone)
    });

    this.httpsListener = this.addListener('httpsListener', {
      protocol: elb.ApplicationProtocol.HTTPS,
      port: 443,
      certificates: [certificate]
    });

    this.targetGroup = this.httpsListener.addTargets('targetGroup', {
      protocol: elb.ApplicationProtocol.HTTP,
      port: 8080,
      healthCheck: {
        enabled: true,
        interval: cdk.Duration.seconds(30),
        healthyThresholdCount: 3,
        unhealthyThresholdCount: 2,
        path: '/healthcheck/',
        timeout: cdk.Duration.seconds(3)
      }
    });

    const robotsTxt = readFileSync('static/robots.txt');

    this.httpsListener.addAction('robots.txt', {
      priority: 10,
      conditions: [elb.ListenerCondition.pathPatterns(['/robots.txt'])],
      action: elb.ListenerAction.fixedResponse(200, {
        contentType: 'plain/text',
        messageBody: robotsTxt.toString()
      })
    });
  }
}
