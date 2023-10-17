import axios from "axios";
import axiosRetry from 'axios-retry';

axios.interceptors.response.use(function (response) {
    return response;
}, function (error) {
    if (error.response) {
        console.error(error.response.status, error.response.data);
    } else {
        console.error(error);
    }
    return Promise.reject(error);
});

axiosRetry(axios, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => !!error.status && (error.status >= 500),
});

export function getEsiClient(token: string) {
    return axios.create({
        baseURL: 'https://esi.evetech.net',
        headers: {
            Authorization: `Bearer ${token}`,
            'Accept-Encoding': 'gzip,deflate,compress'
        },
        validateStatus: function (status) {
            // default || 304=etag matches
            return status >= 200 && status < 300 || status === 304;
        },
    })
}

export function getUnauthenticatedEsiClient() {
    return axios.create({
        baseURL: 'https://esi.evetech.net',
        headers: {
            'Accept-Encoding': 'gzip,deflate,compress'
        },
        validateStatus: function (status) {
            // default || 304=etag matches
            return status >= 200 && status < 300 || status === 304;
        },
    })
}