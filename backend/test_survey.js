async function testSurvey() {
  try {
    const res = await fetch('http://localhost:5001/api/survey/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 1, answers: { risk: 'aggressive' } })
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Data:", data);
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

testSurvey();
