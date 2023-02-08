import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface RedisProps {
  vpc: ec2.IVpc;
}

export class Redis extends Construct {
  public readonly securityGroup;
  public readonly password: secretsmanager.Secret;
  public readonly port = 6379;
  public readonly host;

  constructor(scope: Construct, id: string, props: RedisProps) {
    super(scope, id);

    this.password = new secretsmanager.Secret(this, 'redis-password');

    const subnetGroup = new elasticache.CfnSubnetGroup(this, 'subnetgroup', {
      description: 'frontend-redis-subnet',
      cacheSubnetGroupName: 'frontend-redis-subnet',
      subnetIds: props.vpc.privateSubnets.map((x) => x.subnetId)
    });

    this.securityGroup = new ec2.SecurityGroup(this, 'securitygroup', {
      vpc: props.vpc
    });

    const redis = new elasticache.CfnReplicationGroup(
      this,
      'replicationgroup',
      {
        automaticFailoverEnabled: true,
        replicationGroupId: 'frontend-cache',
        replicationGroupDescription:
          'A Redis cluster for storing user session data for the frontend',
        cacheNodeType: cdk.Fn.conditionIf(
          'isProd',
          'cache.m4.xlarge',
          'cache.t2.small'
        ).toString(),
        numCacheClusters: 3,
        engine: 'redis',
        engineVersion: '6.x',
        cacheParameterGroupName: 'default.redis6.x',
        port: this.port,
        preferredMaintenanceWindow: 'sun:22:00-sun:23:00',
        //notificationTopicArn: '', // TODO
        multiAzEnabled: true,
        atRestEncryptionEnabled: true,
        transitEncryptionEnabled: true,
        authToken: this.password.secretValue.unsafeUnwrap(),

        cacheSubnetGroupName: subnetGroup.cacheSubnetGroupName,
        securityGroupIds: [this.securityGroup.securityGroupId]
      }
    );

    this.host = redis.attrPrimaryEndPointAddress;
  }
}
