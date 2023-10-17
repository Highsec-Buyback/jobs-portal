#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {BackendStack} from '../lib/backend-stack';

function suffix() {
    return !isProd() ? `-${process.env.STACK_SUFFIX}` : '';
}

function isProd() {
    return !process.env.STACK_SUFFIX;
}

const app = new cdk.App();
new BackendStack(app, 'HsbbJobsStack' + suffix(), {
    identityApi: process.env.IDENTITY_API ?? '',
    identityKey: process.env.IDENTITY_KEY ?? '',
    identityApp: process.env.IDENTITY_APP ?? '',
    isProd: isProd()
});