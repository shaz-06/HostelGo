import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 20,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

export default function () {
  const response = http.get(
    'http://localhost:8000/api/products?page=1&limit=20'
  );

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response contains products': (r) => {
      try {
        return Array.isArray(r.json('products'));
      } catch (_) {
        return false;
      }
    },
  });

  sleep(1);
}
