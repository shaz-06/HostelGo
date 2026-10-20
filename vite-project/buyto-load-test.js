
import http from 'k6/http';
import { check, sleep } from 'k6';
export const options = {
  vus: 20,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<2000'],
  },
};

export default function () {
  const response = http.get('http://localhost:8000/api/home');

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response is successful JSON': (r) =>
      r.headers['Content-Type']?.includes('application/json') &&
      r.body.includes('"success":true'),
  });

  sleep(1);
}

