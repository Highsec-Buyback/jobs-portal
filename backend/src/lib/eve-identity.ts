import axios from "axios";

export async function getAccessToken(ownerId: number, minimumDuration: number = 60): Promise<{accessToken: string}> {
    return (await axios.get(`${process.env.IDENTITY_API}/app/${process.env.IDENTITY_APP}/character/${ownerId}/token/?delay=${minimumDuration}`, {
        headers: {
            'x-api-key': process.env.IDENTITY_KEY
        }
    })).data;
}