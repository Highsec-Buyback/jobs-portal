import * as cdk from 'aws-cdk-lib';
import {Duration} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {AttributeType, BillingMode, Table} from "aws-cdk-lib/aws-dynamodb";
import {LambdaIntegration, RestApi} from "aws-cdk-lib/aws-apigateway";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import {Architecture, Runtime} from "aws-cdk-lib/aws-lambda";
import {Rule, Schedule} from "aws-cdk-lib/aws-events";
import * as targets from 'aws-cdk-lib/aws-events-targets';

export class BackendStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: cdk.StackProps & { identityApi: string, identityKey: string, identityApp: string, isProd: boolean }) {
        super(scope, id, props);

        const table = new Table(this, 'Table', {
            billingMode: BillingMode.PAY_PER_REQUEST,
            partitionKey: {
                name: 'pk',
                type: AttributeType.STRING,
            },
            sortKey: {
                name: 'sk',
                type: AttributeType.STRING,
            },
        });

        const api = new RestApi(this, "hsbb-jobs-api", {
            restApiName: "HSBB Jobs",
        });
        const getCourierStatsFunction = this.createFunction({
            name: 'GetCourierStats',
            path: './src/functions/get-courier-stats.ts',
            environment: {
                TABLE: table.tableName,
            },
        });
        table.grantReadData(getCourierStatsFunction);
        const createCodeIntegration = new LambdaIntegration(getCourierStatsFunction, {
            requestTemplates: {"application/json": '{ "statusCode": "200" }'}
        });
        const createCodeResource = api.root.addResource("courier-stats");
        createCodeResource.addMethod("GET", createCodeIntegration);

        const updateCouriers = this.createFunction({
            name: 'UpdateCouriers',
            path: './src/functions/update-couriers.ts',
            environment: {
                TABLE: table.tableName,
                IDENTITY_API: props.identityApi,
                IDENTITY_KEY: props.identityKey,
                IDENTITY_APP: props.identityApp,
            },
            timeout: 60,
        });
        table.grantWriteData(updateCouriers);

        if (props.isProd) {
            const every60Minutes = new Rule(this, 'schedule60mRule', {
                schedule: Schedule.rate(Duration.minutes(60)),
            });
            every60Minutes.addTarget(new targets.LambdaFunction(updateCouriers));
        }
    }

    private createFunction(props: {
        name: string,
        path: string,
        environment?: { [key: string]: string },
        timeout?: number,
        memorySize?: number,
    }) {
        return new NodejsFunction(this, props.name, {
            entry: props.path,
            environment: props.environment,
            bundling: {
                sourceMap: true,
                externalModules: [
                    'aws-sdk'
                ],
            },
            awsSdkConnectionReuse: true,
            architecture: Architecture.ARM_64,
            timeout: Duration.seconds(props.timeout ?? 10),
            runtime: Runtime.NODEJS_18_X,
            memorySize: props.memorySize ?? 256,
        });
    }
}
