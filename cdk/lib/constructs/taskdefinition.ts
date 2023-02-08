import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { IVpc } from 'aws-cdk-lib/aws-ec2';

interface TaskDefinitionProps {
  environment: string;
  apiFqdn: string;
  accountManagementFqdn: string;
  frontendApiFqdn: string;
  frontendFqdn: string;
  serviceDomain: string;
  vpc: IVpc;
  logGroup: logs.ILogGroup;

  redisPassword: secretsmanager.ISecret;
  redisPort: number;
  redisHost: string;
}

export class TaskDefinition extends ecs.FargateTaskDefinition {
  constructor(scope: Construct, id: string, props: TaskDefinitionProps) {
    super(scope, id, {
      cpu: 512,
      memoryLimitMiB: 1024
    });

    const repositoryArn = (accountId: string, name: string) =>
      `arn:aws:ecr:eu-west-2:${accountId}:repository/${name}`;

    this.addContainer('frontend', {
      image: ecs.ContainerImage.fromEcrRepository(
        ecr.Repository.fromRepositoryArn(
          this,
          'frontend-ecr',
          repositoryArn('622942135269', 'frontend')
        ),
        this.node.tryGetContext('git_sha') as string | undefined
      ),
      logging: ecs.LogDriver.awsLogs({
        logGroup: props.logGroup,
        streamPrefix: props.serviceDomain
      }),
      portMappings: [
        {
          containerPort: 3000
        }
      ],
      environment: {
        NODE_ENV: 'production',
        APP_ENV: props.environment,
        FARGATE: '1',
        API_BASE_URL: `https://${props.apiFqdn}`,
        FRONTEND_API_BASE_URL: `https://${props.frontendApiFqdn}`,
        ACCOUNT_MANAGEMENT_URL: `https://${props.accountManagementFqdn}`,
        BASE_URL: props.frontendFqdn,
        ANALYTICS_COOKIE_DOMAIN: props.serviceDomain,
        SERVICE_DOMAIN: props.serviceDomain,
        SUPPORT_INTERNATIONAL_NUMBERS: '1',
        SUPPORT_LANGUAGE_CY: '1',
        REDIS_HOST: props.redisHost,
        REDIS_PORT: `${props.redisPort}`
      },
      secrets: {
        API_KEY: ecs.Secret.fromSecretsManager(
          new secretsmanager.Secret(this, 'apiKey', {
            secretName: '/frontend/apiKey'
          })
        ),
        SESSION_SECRET: ecs.Secret.fromSecretsManager(
          new secretsmanager.Secret(this, 'sessionSecret', {
            secretName: '/frontend/sessionSecret'
          })
        ),
        SESSION_EXPIRY: ecs.Secret.fromSecretsManager(
          new secretsmanager.Secret(this, 'sessionExpiry', {
            secretName: '/frontend/sessionExpiry'
          })
        ),
        GTM_ID: ecs.Secret.fromSecretsManager(
          new secretsmanager.Secret(this, 'gtmId', {
            secretName: '/frontend/gtmId'
          })
        ),
        ZENDESK_API_TOKEN: ecs.Secret.fromSecretsManager(
          new secretsmanager.Secret(this, 'zendeskApiToken', {
            secretName: '/frontend/zendeskApiToken'
          })
        ),
        ZENDESK_GROUP_ID_PUBLIC: ecs.Secret.fromSecretsManager(
          new secretsmanager.Secret(this, 'zendeskGroupIdPublic', {
            secretName: '/frontend/zendeskGroupIdPublic'
          })
        ),
        ZENDESK_USERNAME: ecs.Secret.fromSecretsManager(
          new secretsmanager.Secret(this, 'zendeskUsername', {
            secretName: '/frontend/zendeskUsername'
          })
        ),

        REDIS_PASSWORD: ecs.Secret.fromSecretsManager(props.redisPassword)
      }
    });

    this.addContainer('nginx-sidecar', {
      image: ecs.ContainerImage.fromEcrRepository(
        ecr.Repository.fromRepositoryArn(
          this,
          'nginx-sidecar-ecr',
          repositoryArn('622942135269', 'nginx-sidecar-image')
        ),
        this.node.tryGetContext('git_sha') as string | undefined
      ),
      logging: ecs.LogDriver.awsLogs({
        logGroup: props.logGroup,
        streamPrefix: props.serviceDomain
      }),
      portMappings: [
        {
          containerPort: 8080
        }
      ],
      environment: {
        PROXY_PASS: 'http://localhost:3000',
        NGINX_PORT: '8080',
        NGINX_HOST: props.frontendFqdn,
        TRUSTED_PROXIES: JSON.stringify(
          props.vpc.publicSubnets.map((x) => x.ipv4CidrBlock)
        )
      },
      secrets: {
        BASIC_AUTH_USERNAME: ecs.Secret.fromSecretsManager(
          new secretsmanager.Secret(this, 'basicAuthUsername', {
            secretName: '/frontend/basicAuthUsername'
          })
        ),
        BASIC_AUTH_PASSWORD: ecs.Secret.fromSecretsManager(
          new secretsmanager.Secret(this, 'basicAuthPassword', {
            secretName: '/frontend/basicAuthPassword'
          })
        )
      }
    });
  }
}
