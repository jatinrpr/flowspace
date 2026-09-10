import jwt from 'jsonwebtoken';

async function run() {
  const token = jwt.sign(
    {}, 
    'local-development-access-secret-change-before-deployment', 
    { expiresIn: '1h', subject: 'cmtros8ut0000f3wc6tsvknku' }
  );
  
  const convRes = await fetch('http://localhost:5000/api/conversations/cmtrsvhuh0005f3944qew79rj', {
    headers: {
      'Cookie': `access_token=${token}`
    }
  });
  
  const convData = await convRes.text();
  console.log('Conversation Response:', convData);
}

run().catch(console.error);
