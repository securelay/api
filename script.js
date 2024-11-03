// Brief: Helper functions for accessing Securelay: https://securelay.github.io
// Usage: All functions exported below are available for import. Import this module in your Javascript as -
//     import * as securelay from 'https://raw.githubusercontent.com/securelay/api/main/script.js'
// Or from the CDN link: 'https://cdn.jsdelivr.net/gh/securelay/api@main/script.js'
//   Access the imported functions as -
//     securelay.func()
// Args: key and ID below respectively denote private key and endpoint ID.
// Example: See test.js for usage example.

const endpoints = { alz2h: ['https://securelay.vercel.app'] };

const keyring = new Map();

// Returns an element randomly drawn from the given array.
function randElement (array) {
  const randomIdx = Math.floor(Math.random() * array.length);
  return array[randomIdx];
}

// Retruns a URL string.
// Default export. May be imported as: `import securelayUrl from 'https://raw.githubusercontent.com/securelay/api/main/script.js'`
export default function endpoint (ID = null) {
  const endpointID = ID ?? randElement(Object.keys(endpoints));
  if (!Object.hasOwn(endpoints, endpointID)) throw new Error(404);
  return [randElement(endpoints[endpointID]), endpointID];
}

// Returns a new private key.
export async function key (ID, timeout = null) {
  const endpointUrl = endpoint(ID)[0];
  const url = `${endpointUrl}/keys`;
  const data = await fetch(url, { signal: timeout ? AbortSignal.timeout(timeout) : null })
    .then((response) => {
      if (!response.ok) throw new Error(response.status);
      return response.json();
    });
  keyring.set(data.private, data.public); // store keys in keyring for future reference
  return data.private;
}

// Returns URL string.
function url (type) {
  async function _ (key, ID, timeout = null) {
    const endpointUrl = endpoint(ID)[0];
    if (keyring.has(key)) return `${endpointUrl}/${type}/${type === 'private' ? key : keyring.get(key)}`;
    const url = `${endpointUrl}/keys/${key}`;
    const data = await fetch(url, { signal: timeout ? AbortSignal.timeout(timeout) : null })
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

export const privateUrl = url('private');
export const publicUrl = url('public');

// Returns Javascript object obtained from parsing the response JSON.
export async function sync (key, ID, webhook = null, timeout = null) {
  const endpointUrl = endpoint(ID)[0];
  let query = '';
  if (webhook) query = `?hook=${encodeURIComponent(webhook)}`;
  const url = `${endpointUrl}/private/${key}${query}`;
  return fetch(url, { signal: timeout ? AbortSignal.timeout(timeout) : null })
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

  async function publisher (key, ID, data, timeout = null) {
    const endpointUrl = endpoint(ID)[0];
    const url = `${endpointUrl}/private/${key}`;
    const payload = encode(data);
    return fetch(url, {
      method: 'POST',
      headers,
      body: payload,
      signal: timeout ? AbortSignal.timeout(timeout) : null
    })
      .then((response) => {
        if (!response.ok) throw new Error(response.status);
        return response.json();
      });
  }

  return publisher;
}

// Args: key, ID, data, timeout = null
// Returns: Javascript object obtained from parsing the response JSON.
export const pubForm = publish('formData'); // data type is FormData
export const pubJson = publish('json'); // data type is {}
export const pubText = publish('text'); // data type is text
