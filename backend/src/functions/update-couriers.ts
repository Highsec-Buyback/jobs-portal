import {ddb} from "../lib/ddb-client";
import {PutCommand} from "@aws-sdk/lib-dynamodb";
import {getEsiClient, getUnauthenticatedEsiClient} from "../lib/esi";
import {getAccessToken} from "../lib/eve-identity";

const LERSO = 93475128;
const HSBB = 98649014;

export const handler = async () => {

    try {
        await getUnauthenticatedEsiClient().get(`/v2/status`)
    } catch (_) {
        console.log('ESI is not available.')
        return;
    }

    const {accessToken} = await getAccessToken(LERSO);
    const esi = getEsiClient(accessToken);

    const contractsResponse = await esi.get(`/v1/corporations/${HSBB}/contracts`);
    const contracts = contractsResponse.data.filter((c) => c.type === 'courier').filter((c) => c.status === 'outstanding');
    // Don't read more than 10 pages. That should keep the function relatively fast, while looking at a long enough time range (10k contracts).
    for (let i = 2; i <= Math.min(+contractsResponse.headers['x-pages'], 10); i++) {
        const nextPage = await esi.get(`/v1/corporations/${HSBB}/contracts?page=${i}`);
        contracts.push(...nextPage.data.filter((c) => c.type === 'courier').filter((c) => c.status === 'outstanding'));
    }

    const couriers = contracts.filter((c) => c.type === 'courier').filter((c) => c.status === 'outstanding');
    const publicCouriers = couriers.filter((c) => c.availability === 'public');
    const publicBR = publicCouriers.filter((c) => c.volume <= 12_500);
    const publicDST = publicCouriers.filter((c) => c.volume > 12_500 && c.volume <= 62_500);
    const publicFreighter = publicCouriers.filter((c) => c.volume > 62_500);
    const redFrogCouriers = couriers.filter((c) => c.assignee_id === 1495741119);
    const pushXCouriers = couriers.filter((c) => c.assignee_id === 98079862);

    await ddb.send(new PutCommand({
        TableName: process.env.TABLE,
        Item: {
            pk: 'courier-stats',
            sk: 'courier-stats',
            publicBR: publicBR.length,
            publicDST: publicDST.length,
            publicFreighter: publicFreighter.length,
            redFrog: redFrogCouriers.length,
            pushX: pushXCouriers.length,
        }
    }));
};
