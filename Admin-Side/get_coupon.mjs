import fs from 'fs';

async function fetchCoupons() {
  const loginRes = await fetch('http://15.206.163.52/api/v1/admin/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'aman@svasthya.com', password: 'Aman@123' })
  });
  const data = await loginRes.json();
  const token = data?.data?.token || data?.token;
  
  const getRes = await fetch('http://15.206.163.52/api/v1/admin/coupons', { headers: { 'Authorization': 'Bearer ' + token } });
  const couponsData = await getRes.json();
  const list = Array.isArray(couponsData) ? couponsData : couponsData.data || couponsData.content || couponsData.coupons || [];
  
  const relevant = list.filter(c => ['Test30', 'TEST1', 'T1', 'T2', 'T3', 'FRESH20'].includes(c.code));
  console.log(JSON.stringify(relevant, null, 2));
}

fetchCoupons();
