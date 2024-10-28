import * as securelay from './script.js'; // 'https://raw.githubusercontent.com/securelay/api/main/script.js';
import securelayUrl from './script.js'; // 'https://cdn.jsdelivr.net/gh/securelay/api@main/script.min.js';

const [endpoint, ID] = securelayUrl();
console.log('endpoint = ' + endpoint);
console.log('endpoint_ID = ' + ID);
const key = await securelay.key(ID);
console.log('private key = ' + key);
console.log('public URL for the above key = ' + await securelay.publicUrl(key, ID));

console.log('Lets take a sample key and a sample ID from the Securelay API documentation');
const sampleKey = '3zTryeMxkq';
const sampleID = 'alz2h';
console.log('Sample private key = ' + sampleKey);
console.log('Sample endpoint ID = ' + sampleID);
const samplePublicUrl = await securelay.publicUrl(sampleKey, sampleID);

console.log('public URL for the sample = ' + samplePublicUrl);

console.log('Trying publishing...');

try {
  await securelay.pubJson(sampleKey + '/json', sampleID, { hello: 'world' });
  console.log('JSON publication successful. Retrieval link: ' + samplePublicUrl + '/json');
} catch (err) {
  console.error('Error during publishing JSON\n' + err.message);
}

try {
  await securelay.pubText(sampleKey, sampleID, 'hello world');
  console.log('Text publication successful. Retrieval link: ' + samplePublicUrl);
} catch (err) {
  console.error('Error during publishing text\n' + err.message);
}

const formData = new FormData();
formData.append('hello', 'world');
try {
  await securelay.pubForm(sampleKey + '/form', sampleID, formData);
  console.log('Form publication successful. Retrieval link: ' + samplePublicUrl + '/form');
} catch (err) {
  console.error('Error during publishing form\n' + err.message);
}

console.log('Trying syncing. Should get [{"hello":"world"}]');
try {
  await fetch(samplePublicUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hello: 'world' })
  });
  console.log(JSON.stringify(await securelay.sync(sampleKey, sampleID)));
} catch (err) {
  console.error('Error during syncing\n' + err.message);
}
