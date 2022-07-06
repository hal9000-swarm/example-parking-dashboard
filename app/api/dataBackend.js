const fetch = (...args) =>
    import('node-fetch').then(({default: fetch}) => fetch(...args));


class HTTPResponseError extends Error {
    constructor(response, ...args) {
        super(`HTTP Error Response: ${response.status} ${response.statusText}`,
            ...args);
        this.response = response;
    }
}

const checkStatus = response => {
    if (response.ok) {
        return response;
    } else {
        throw new HTTPResponseError(response);
    }
}

async function getData(query, authtoken) {
    let headers = {
        "Authorization": authtoken.accessToken
    }
    try {
        const response = await fetch(query, {headers: headers})
        checkStatus(response);
        return await response.json()
    } catch (error) {
        console.error(error);
        throw error;
    }

}

module.exports = getData;