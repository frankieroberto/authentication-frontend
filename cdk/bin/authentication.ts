#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CliCredentialsStackSynthesizer } from 'aws-cdk-lib';
import { FrontendStack } from '../lib/stacks/frontend';
import { RepositoryStack } from '../lib/stacks/repository';

const app = new cdk.App();

new FrontendStack(app, 'frontend', {
  synthesizer: new CliCredentialsStackSynthesizer()
});

new RepositoryStack(app, 'frontend-repository', {
  env: { account: '622942135269', region: 'eu-west-2' },
  synthesizer: new CliCredentialsStackSynthesizer()
});
app.synth();
