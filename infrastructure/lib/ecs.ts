import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecrAssets from "aws-cdk-lib/aws-ecr-assets";
import * as logs from "aws-cdk-lib/aws-logs";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

import { getParameter, getSecureParameter, newSecret } from "./parameters";

import { Construct } from "constructs";

interface ECSProps {
    environment: string,
    taskLogGroup: logs.ILogGroup,
    parameterPrefix: string
}

export class ECS extends Construct {
    constructor(scope: Construct, id: string, props: ECSProps) {
        super(scope, id);

        const serviceName = `${props.environment}-frontend-ecs-service`;
        const containerName = 'frontend-application';
        const appPort = 3000; // TODO
        const nginxPort = 8080;

        const desiredCount = 1;

        const parameterBase = "";

        // TODO idealy these should probably be lookups from Parameter Store
        const oidcApiFqdn = "";
        const frontendApiFqdn = "";
        const accountManagementFqdn = "";
        const apiKey = "";
        const baseUrl = "";
        const sessionExpiry = "";
        const sessionSecret = ;
        const gtmId = "";
        const serviceDomain = "";
        const redisKey = "";

        const image = new ecrAssets.DockerImageAsset(this, 'image', {
            directory: '.'
        });

        const cluster = new ecs.Cluster(this, 'cluster', {});

        const taskDefinition = new ecs.FargateTaskDefinition(this, 'task-definition', {
        });

        taskDefinition.addContainer('frontend', {
            image: ecs.ContainerImage.fromDockerImageAsset(image),
            containerName,
            essential: true,
            logging: ecs.LogDriver.awsLogs({
                streamPrefix: serviceName,
                logGroup: props.taskLogGroup
            }),
            portMappings: [{
                containerPort: appPort
            }],
            environment: {
                NODE_ENV: 'production',
                APP_ENV: props.environment,
                FARGATE: '1',
                API_BASE_URL: `https://${getParameter(this, 'oidcApiFqdn', props)}`,
                FRONTEND_API_BASE_URL: `https://${getParameter(this, 'frontendApiFqdn', props)}/`,
                API_KEY: getParameter(this, 'apiKey', props),
                ACCOUNT_MANAGEMENT_URL: `https://${getParameter(this, 'accountManagementFqdn', props)}`,
                BASE_URL: getParameter(this, 'baseUrl', props),
                SESSION_EXPIRY: getParameter(this, 'sessionExpiry', props),
                SESSION_SECRET: getSecureParameter(this, 'sessionSecret', props),
                GTM_ID: getParameter(this, 'gtmId', props),
                ANALYTICS_COOKIE_DOMAIN: getParameter(this, 'serviceDomain', props),
                REDIS_KEY: 'frontend',
                SUPPORT_INTERNATIONAL_NUMBERS: getParameter(this, 'supportInternationalNumbers', props),
                SUPPORT_LANGUAGE_CY: getParameter(this, 'supportLanguageCy', props),
                ZENDESK_API_TOKEN: getParameter(this, 'zendeskApiToken', props),
                ZENDESK_GROUP_ID_PUBLIC: getParameter(this,'zendeskGroupIdPublic', props),
                ZENDESK_USERNAME: getParameter(this, 'zendeskUsername', props),
                SERVICE_DOMAIN: getParameter(this, 'serviceDomain', props)
            }
        });

        taskDefinition.addContainer('nginx', {
            containerName: 'nginx',
            image: ecs.ContainerImage.fromRegistry("nginx"), // TODO not actually
            essential: true,
            logging: ecs.LogDriver.awsLogs({
                streamPrefix: serviceName,
                logGroup: props.taskLogGroup
            }),
            portMappings: [{
                containerPort: nginxPort
            }],
            environment: {
                BASIC_AUTH_USERNAME: getParameter(this, 'basicAuthUsername', props),
                BASIC_AUTH_PASSWORD: getSecureParameter(this, 'basicAuthPassword', props),
                PROXY_PASS: `http://localhost:${appPort}`,
                NGINX_PORT: `${nginxPort}`,
                NGINX_HOST: getParameter(this, 'frontendApiFqdn', props),
                IP_ALLOW_LIST: getParameter(this, 'ipAllowList', props),
                TRUSTED_PROXIES: "" // TODO, will be a list of public subnet CIDRs

            }
        })

        const service = new ecs.FargateService(this, 'service', {
            cluster,
            taskDefinition,
            desiredCount
        });
    }
}