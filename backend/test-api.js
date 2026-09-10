

async function run() {
  // 1. Login to get token
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'jatinmuwal2005@gmail.com', password: 'password123' })
  });
  
  const loginData = await loginRes.json();
  console.log('Login:', loginData);
  
  if (!loginData.accessToken) {
    console.error('Login failed, no token');
    return;
  }
  
  const token = loginData.accessToken;
  
  // 2. Fetch conversation
  const convRes = await fetch('http://localhost:5000/api/conversations/cmtrsvhuh0005f3944qew79rj', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const convData = await convRes.text();
  console.log('Conversation Response:', convData);
}

run().catch(console.error);
