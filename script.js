// Brief: Helper functions for accessing Securelay: https://securelay.github.io
// Usage:
//   All functions exported below constitute the API/library.
//   All exported functions, except the default, are asynchronous.
//   Import this module in your Javascript as -
//     import * as securelay from 'https://securelay.github.io/api/script.js'
//   Or from the CDN link: 'https://cdn.jsdelivr.net/gh/securelay/api@main/script.js'
//   Access the imported functions as -
//     securelay.func()
// Args: key and ID below respectively denote private key and endpoint ID.
// Example: See 'https://securelay.github.io/api/test.js' for usage example.

export const version = '0.0.5';

const endpoints = await fetch(`https://cdn.jsdelivr.net/gh/securelay/api@v${version}/endpoints.json`)
  .then((response) => response.json());

const keyring = new Map();

// Returns an element randomly drawn from the given array.
function randElement (array) {
  const randomIdx = Math.floor(Math.random() * array.length);
  return array[randomIdx];
}

// Returns the array containing two string elements: [ <URL of a Securelay server> , <its endpoint ID> ]
// Optionally, pass your chosen endpoint ID as argument.
// Note: This is the default export.
// May also be imported as: `import securelayUrl from 'https://raw.githubusercontent.com/securelay/api/main/script.js'`
export default function endpoint (ID = null) {
  const endpointID = ID ?? randElement(Object.keys(endpoints));
  if (!Object.hasOwn(endpoints, endpointID)) throw new Error(404);
  return [randElement(endpoints[endpointID]), endpointID];
}

// Returns a new private key.
// options = { timeout: <milliseconds> }
export async function key (ID, options = {}) {
  const endpointUrl = endpoint(ID)[0];
  const url = `${endpointUrl}/keys`;
  const opts = {};
  if (options.timeout) opts.signal = AbortSignal.timeout(options.timeout);
  const data = await fetch(url, opts)
    .then((response) => {
      if (!response.ok) throw new Error(response.status);
      return response.json();
    });
  keyring.set(data.private, data.public); // store keys in keyring for future reference
  return data.private;
}

// Returns URL string.
function url (type) {
  // options = { timeout: <milliseconds> }
  async function _ (key, ID, options = {}) {
    const endpointUrl = endpoint(ID)[0];
    if (keyring.has(key)) return `${endpointUrl}/${type}/${type === 'private' ? key : keyring.get(key)}`;
    const url = `${endpointUrl}/keys/${key}`;
    const opts = {};
    if (options.timeout) opts.signal = AbortSignal.timeout(options.timeout);
    const data = await fetch(url, opts)
      .then((response) => {
        if (!response.ok) throw new Error(response.status);
        return response.json();
      });
    if (!Object.hasOwn(data, 'public')) throw new Error(404);
    keyring.set(key, data.public); // store keys in keyring for future reference
    return `${endpointUrl}/${type}/${type === 'private' ? key : data.public}`;
  }
  return _;
}

// Returns URL string.
// args: key, ID, options
// options = { timeout: <milliseconds> }
export const privateUrl = url('private');
export const publicUrl = url('public');

// Returns Javascript object obtained from parsing the response JSON.
// options = { webhook: <urlString>, timeout: <milliseconds> }
export async function sync (key, ID, options = {}) {
  const endpointUrl = endpoint(ID)[0];
  let query = '';
  if (options.webhook) query = `?hook=${encodeURIComponent(options.webhook)}`;
  const url = `${endpointUrl}/private/${key}${query}`;
  const opts = {};
  if (options.timeout) opts.signal = AbortSignal.timeout(options.timeout);
  return fetch(url, opts)
    .then((response) => {
      if (!response.ok) throw new Error(response.status);
      return response.json();
    });
}

// This function is nested and constitutes a closure.
// Takes MimeType as parameter and returns a function.
function publish (type) {
  const headers = {};
  let encode = (data) => data; // Default: no encoding

  switch (type) {
    case 'formData':
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      encode = (formData) => new URLSearchParams(formData);
      break;
    case 'json':
      headers['Content-Type'] = 'application/json';
      encode = JSON.stringify;
      break;
    case 'text':
      headers['Content-Type'] = 'text/plain';
      break;
  }

  // options = { field: <string>, password: <string>, timeout: <milliseconds> }
  async function publisher (key, ID, data, options = {}) {
    const endpointUrl = endpoint(ID)[0];
    const field = options.field ? `/${options.field}` : '';
    const url = `${endpointUrl}/private/${key}${field}`;
    const payload = encode(data);
    let query = '';
    if (options.password) query = `?password=${options.password}`;
    const opts = {
      method: 'POST',
      headers,
      body: payload
    };
    if (options.timeout) opts.signal = AbortSignal.timeout(options.timeout);
    return fetch(url + query, opts)
      .then((response) => {
        if (!response.ok) throw new Error(response.status);
        return response.json();
      });
  }

  return publisher;
}

// args: key, ID, data, options
// options = { field: <string>, password: <string>, timeout: <milliseconds> }
// Returns: Javascript object obtained from parsing the response JSON.
export const pubForm = publish('formData'); // data type is FormData
export const pubJson = publish('json'); // data type is {}
export const pubText = publish('text'); // data type is text

// Unpublish previously published data.
// Default: unpublishes from CDN. Use truthy value for `secret` property to unpublish password protected content
// options = { secret: <Boolean>, timeout: <milliseconds> }
export async function unpublish (key, ID, options = {}) {
  const endpointUrl = endpoint(ID)[0];
  const url = `${endpointUrl}/private/${key}`;
  const query = options.secret ? '?password' : '';
  const opts = { method: 'DELETE' };
  if (options.timeout) opts.signal = AbortSignal.timeout(options.timeout);
  return fetch(url + query, opts)
    .then((response) => {
      if (!response.ok) throw new Error(response.status);
    });
}

// Renew (to extend expiry) previously published data.
// Default: renews CDN. Use truthy value for `secret` property to renew password protected content
// Returns: Javascript object obtained from parsing the response JSON.
// options = { secret: <Boolean>, timeout: <milliseconds> }
export async function renew (key, ID, options = {}) {
  const endpointUrl = endpoint(ID)[0];
  const url = `${endpointUrl}/private/${key}`;
  const query = options.secret ? '?password' : '';
  const opts = { method: 'PATCH' };
  if (options.timeout) opts.signal = AbortSignal.timeout(options.timeout);
  return fetch(url + query, opts)
    .then((response) => {
      if (!response.ok) throw new Error(response.status);
      return response.json();
    });
}

// Returns OneSignal App ID for web-push notifications for given endpointID and app
// options = { timeout: <milliseconds> }
export async function appId (ID, app, options = {}) {
  const endpointUrl = endpoint(ID)[0];
  const url = `${endpointUrl}/properties`;
  const opts = {};
  if (options.timeout) opts.signal = AbortSignal.timeout(options.timeout);
  return fetch(url, opts)
    .then((response) => {
      if (!response.ok) throw new Error(response.status);
      return response.json();
    })
    .then((obj) => {
      return obj.OneSignalAppId[app.toLowerCase()];
    });
}
