import {APIGatewayProxyHandler} from "aws-lambda";
import {GetCommand} from "@aws-sdk/lib-dynamodb";
import {ddb} from "../lib/ddb-client";

export const handler: APIGatewayProxyHandler = async (event) => {
    const stats = (await ddb.send(new GetCommand({
        TableName: process.env.TABLE,
        Key: {
            pk: 'courier-stats',
            sk: 'courier-stats',
        }
    }))).Item;

    return {
        statusCode: 200,
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(stats),
    };
};
