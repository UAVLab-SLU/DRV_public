import { BASE_URL } from './const';


// SAMPLE CODE FOR FETCH PARAMS
// ====================================
// const response = await fetch(url, {
//     method: "POST", // *GET, POST, PUT, DELETE, etc.
//     mode: "cors", // no-cors, *cors, same-origin
//     cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
//     credentials: "same-origin", // include, *same-origin, omit
//     headers: {
//       "Content-Type": "application/json",
//       // 'Content-Type': 'application/x-www-form-urlencoded',
//     },
//     redirect: "follow", // manual, *follow, error
//     referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
//     body: JSON.stringify(data), // body data type must match "Content-Type" header
//   });
//   return response.json(); // parses JSON response into native JavaScript objects
// }

function constructURL(baseURL, paramsObject) {

    if(!paramsObject){
        return baseURL;
    }

    // Ensure baseURL ends with a '?'
    if (!baseURL.endsWith('?') && !baseURL.endsWith('&')) {
        baseURL += '?';
    }

    // Serialize paramsObject into query parameters
    const queryString = Object.keys(paramsObject)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(paramsObject[key])}`)
        .join('&');

    // Concatenate baseURL with queryString
    return baseURL + queryString;
}

const supportedGetTypes = ["JSON", "TEXT"];

export function callAPI(endpoint,
    httpMethod,
    jsonBody,
    APIResponseFrom,
    authorizationToken = null) {

    // BASE API URL
    let URL = `${BASE_URL}/${endpoint}`;

    // check if the APIResponseFrom is present inside the supportedGetTypes
    if (!supportedGetTypes.includes(APIResponseFrom)) {
        throw new Error("API Fetch Failed, we are only supporting JSON or TEXT Fetch currently")
    }

    let headers = new Headers();

    // in future we add the authorization we can add to the header
    if (authorizationToken) {
        headers.append("Authorization", authorizationToken);
    }

    let requestOptions = {
        method: httpMethod,
        headers: headers,
    }
    if (httpMethod === 'POST') {
        headers.append("Content-Type", "application/json");
        requestOptions["headers"] = headers;
        requestOptions["body"] = JSON.stringify(jsonBody);
    } else if (httpMethod === "GET") {
        URL = constructURL(URL, jsonBody);
    }

    return new Promise((resolve, reject) => {
        fetch(URL, requestOptions)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("API call failed!")
                }

                if (APIResponseFrom === "JSON") {
                    return response.json();
                }
                return response.text()
            })
            .then((data) => {
                resolve(data);
            })
            .catch((error) => {
                reject(error);
            });
    });
}
