#!/usr/bin/env node

const cdk = require('aws-cdk-lib');
const { BulletinBoardStack } = require('../lib/bulletin-board-stack');

const app = new cdk.App();
new BulletinBoardStack(app, 'BulletinBoardStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});