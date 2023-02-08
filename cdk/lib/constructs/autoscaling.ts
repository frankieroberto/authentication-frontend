import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-applicationautoscaling';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

interface AutoScalingProps {
  cluster: ecs.ICluster;
  service: ecs.IService;
}

export class AutoScaling extends autoscaling.ScalableTarget {
  constructor(scope: Construct, id: string, props: AutoScalingProps) {
    const minCapacity = ssm.StringParameter.valueForStringParameter(
      scope,
      '/frontend/minCapacity'
    );
    const maxCapacity = ssm.StringParameter.valueForStringParameter(
      scope,
      '/frontend/maxCapacity'
    );

    const memoryTarget = ssm.StringParameter.valueForStringParameter(
      scope,
      '/frontend/memoryTarget'
    );
    const cpuTarget = ssm.StringParameter.valueForStringParameter(
      scope,
      '/frontend/cpuTarget'
    );

    const scaleInCooldown = ssm.StringParameter.valueForStringParameter(
      scope,
      '/frontend/scaleInCooldown'
    );
    const scaleOutCooldown = ssm.StringParameter.valueForStringParameter(
      scope,
      '/frontend/scaleOutCooldown'
    );

    super(scope, id, {
      scalableDimension: 'ecs:service:DesiredCount',
      serviceNamespace: autoscaling.ServiceNamespace.ECS,
      resourceId: `service/${props.cluster.clusterName}/${props.service.serviceName}`,
      minCapacity: cdk.Token.asNumber(minCapacity),
      maxCapacity: cdk.Token.asNumber(maxCapacity)
    });

    new autoscaling.TargetTrackingScalingPolicy(this, 'memory', {
      scalingTarget: this,
      targetValue: cdk.Token.asNumber(memoryTarget),
      predefinedMetric:
        autoscaling.PredefinedMetric.ECS_SERVICE_AVERAGE_MEMORY_UTILIZATION,
      scaleInCooldown: cdk.Duration.seconds(
        cdk.Token.asNumber(scaleInCooldown)
      ),
      scaleOutCooldown: cdk.Duration.seconds(
        cdk.Token.asNumber(scaleOutCooldown)
      )
    });

    new autoscaling.TargetTrackingScalingPolicy(this, 'cpu', {
      scalingTarget: this,
      targetValue: cdk.Token.asNumber(cpuTarget),
      predefinedMetric:
        autoscaling.PredefinedMetric.ECS_SERVICE_AVERAGE_CPU_UTILIZATION,
      scaleInCooldown: cdk.Duration.seconds(
        cdk.Token.asNumber(scaleInCooldown)
      ),
      scaleOutCooldown: cdk.Duration.seconds(
        cdk.Token.asNumber(scaleOutCooldown)
      )
    });
  }
}
