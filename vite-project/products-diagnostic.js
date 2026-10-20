import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 20,
  duration: '30s',
};

export default function () {
  const response = http.get(
    'http://localhost:8000/api/products?page=1&limit=20'
  );

  if (response.status !== 200) {
    console.log(
      `HTTP ${response.status} | ${response.error || 'No transport error'} | ${response.body ? String(response.body).slice(0, 150) : 'No response body'}`
    );
  }

  sleep(1);
}
