import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

export class RepositoryStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);
    const accountIds = [
      '622942135269',
      '222110992898',
      '584341672019',
      '758531536632'
    ];

    const encryptionKey = new kms.Key(this, 'encryptionKey', {
      enableKeyRotation: true
    });

    const frontendRepository = new ecr.Repository(this, 'frontend', {
      repositoryName: 'frontend',
      imageScanOnPush: true,
      imageTagMutability: ecr.TagMutability.IMMUTABLE,
      encryptionKey
    });

    const sidecarRepository = new ecr.Repository(this, 'basic-auth-sidecar', {
      repositoryName: 'basic-auth-sidecar',
      imageScanOnPush: true,
      imageTagMutability: ecr.TagMutability.IMMUTABLE,
      encryptionKey
    });

    for (const accountId of accountIds) {
      frontendRepository.grantPull(new iam.AccountPrincipal(accountId));
      sidecarRepository.grantPull(new iam.AccountPrincipal(accountId));
    }

    const deployRole = new iam.Role(this, 'deployrole', {
      roleName: 'gha-ecr-role',
      assumedBy: new iam.FederatedPrincipal(
        'token.actions.githubusercontent.com',
        {
          StringEquals: {
            'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com'
          },
          StringLike: {
            'token.actions.githubusercontent.com:sub':
              'repo:alphagov/di-authentication-frontend:*'
          }
        }
      )
    });
    frontendRepository.grantPullPush(deployRole);
    sidecarRepository.grantPullPush(deployRole);
  }
}
