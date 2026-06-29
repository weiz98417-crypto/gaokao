import http from 'http';

const data = JSON.stringify({
  province: '广东省',
  score: 628,
  subjects: ['物理', '化学', '生物'],
  preferences: {
    subjectType: '物理',
    preferredCities: ['广州', '北京', '杭州'],
    disciplines: ['工学']
  }
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/recommend',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(data)
  },
  timeout: 60000
}, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    const parsed = JSON.parse(body);
    console.log(`HTTP ${res.statusCode}, code: ${parsed.code}`);
    if (parsed.code === 200 && parsed.data) {
      console.log(`\n🎯 ${parsed.data.length} recommendations:`);
      for (const item of parsed.data) {
        const llmUsed = item.reason !== '基于历年录取位次自动推荐';
        console.log(`${item.tier} | ${item.college} | ${item.major}(${item.majorGroup}) | ${item.city} | prob:${item.probability}% | plan:${item.planCount} | LLM:${llmUsed}`);
      }
    } else {
      console.log('FAILED:', JSON.stringify(parsed).substring(0, 500));
    }
  });
});
req.on('timeout', () => { req.destroy(); console.log('TIMEOUT'); });
req.on('error', (e) => console.error('Error:', e.message));
req.write(data);
req.end();
