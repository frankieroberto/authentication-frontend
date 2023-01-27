import { Duration } from "aws-cdk-lib";
import { ISubnet, IVpc } from "aws-cdk-lib/aws-ec2";
import { ApplicationLoadBalancer, ApplicationProtocol, IApplicationLoadBalancer, ListenerAction, ListenerCertificate, ListenerCondition, Protocol, SslPolicy } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Construct } from "constructs";

export interface FrontendALBProps {
    vpc: IVpc,
    subnets: ISubnet[],
}

export class FrontendALB extends Construct {
    public loadbalancer: IApplicationLoadBalancer;

    constructor(scope: Construct, id: string, props: FrontendALBProps) {
        super(scope, id);

        this.loadbalancer = new ApplicationLoadBalancer(this, 'frontend-alb', {
            vpc: props.vpc,
            vpcSubnets: {
                subnets: props.subnets
            },
            internetFacing: false
        });

        const httpListener = this.loadbalancer.addListener('http-listener', {
            port: 80,
            protocol: ApplicationProtocol.HTTP,
            defaultAction: ListenerAction.redirect({
                port: "443",
                protocol: "HTTPS",
                permanent: true
            })
        });

        const certificate = ListenerCertificate.fromArn('...'); // TODO

        const listener = this.loadbalancer.addListener('listener', {
            port: 443,
            certificates: [certificate],
            protocol: ApplicationProtocol.HTTPS,
            sslPolicy: SslPolicy.RECOMMENDED_TLS // TODO
        });

        listener.addAction('robots.txt', {
            conditions: [
                ListenerCondition.pathPatterns(['/robots.txt'])
            ],
            action: ListenerAction.fixedResponse(200, {
                contentType: "text/plain",
                messageBody: 'OK', // TODO: best way to serve static content, probably embed robots.txt in the stack
            })
        })

        listener.addTargets('target', {
            deregistrationDelay: Duration.seconds(30), // TODO: set this from a variable
            healthCheck: {
                enabled: true,
                healthyThresholdCount: 3,
                unhealthyThresholdCount: 2,
                interval: Duration.seconds(30),
                timeout: Duration.seconds(3),
                protocol: Protocol.HTTP,
                path: "/healthcheck/"
            },
            targets: [] // TODO
        })
    }
}