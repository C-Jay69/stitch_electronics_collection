const url = 'http://localhost:3000/api/admin/scrape';
// Using a mock or a simple site for testing, e.g., example.com
const body = JSON.stringify({ url: 'https://example.com' });

fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body
})
    .then(res => res.json())
    .then(data => console.log(JSON.stringify(data, null, 2)))
    .catch(err => console.error(err));
