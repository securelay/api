import * as securelay from './script.js'; // 'https://securelay.github.io/api/script.js';
import securelayUrl from './script.js'; // 'https://cdn.jsdelivr.net/gh/securelay/api@main/script.min.js';

console.log('Version =', securelay.version);

const [endpoint, ID] = securelayUrl();
console.log('endpoint = ' + endpoint);
console.log('endpoint_ID = ' + ID);
console.log('OneSignal App ID for formonit =', await securelay.appId(ID, 'formonit'));
const key = await securelay.key(ID);
console.log('private key = ' + key);
console.log('public URL for the above key = ' + await securelay.publicUrl(key, ID));
console.log('private URL for the above key = ' + await securelay.privateUrl(key, ID));

const stdArgs = [key, ID];
const samplePublicUrl = await securelay.publicUrl(...stdArgs);

console.log('public URL for the sample = ' + samplePublicUrl);

console.log('Trying publishing...');
console.log('Testing pubJson() with field = "json":');
try {
  await securelay.pubJson(...stdArgs, { hello: 'world' }, { field: 'json' });
  console.log('JSON publication successful. Retrieval link: ' + samplePublicUrl + '/json');
} catch (err) {
  console.error('Error during publishing JSON\n' + err.message);
}
console.log('Testing pubForm() with field = "form":');
const formData = new FormData();
formData.append('hello', 'world');
try {
  await securelay.pubForm(...stdArgs, formData, { field: 'form' });
  console.log('Form publication successful. Retrieval link: ' + samplePublicUrl + '/form');
} catch (err) {
  console.error('Error during publishing form\n' + err.message);
}
console.log('Testing pubText():');
try {
  await securelay.pubText(...stdArgs, 'hello world');
  console.log('Text publication successful. Retrieval link: ' + samplePublicUrl);
} catch (err) {
  console.error('Error during publishing text\n' + err.message);
}

console.log('Renewing published content returns:');
try {
  console.log(JSON.stringify(await securelay.renew(...stdArgs)));
} catch (err) {
  console.error('Error during publishing text\n' + err.message);
}

console.log('Deleting published content...');
try {
  await securelay.unpublish(...stdArgs);
} catch (err) {
  console.error('Error during publishing text\n' + err.message);
}

console.log('Publishing, retrieving and deleting a secret ...');
try {
  const data = 'classified';
  await securelay.pubText(...stdArgs, data, { password: 'someSecret' });
  console.log('Published:', data);
  console.log('Retrieved:', await fetch(samplePublicUrl + '?password=someSecret')
    .then((response) => {
      if (!response.ok) throw new Error(response.status);
      return response.json();
    })
    .then((json) => json.data)
  );
  console.log('Deleting the data ...');
  await securelay.unpublish(...stdArgs, { secret: true });
} catch (err) {
  console.error('Error with password protected publication text\n' + err.message);
}

console.log('Trying syncing after a public post. Should get [{"hello":"world"}]');
try {
  await fetch(samplePublicUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hello: 'world' })
  });
  console.log(JSON.stringify(await securelay.sync(...stdArgs)));
} catch (err) {
  console.error('Error during syncing\n' + err.message);
}
