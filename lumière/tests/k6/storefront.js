/* global __ENV */
import http from "k6/http";
import { check, sleep } from "k6";

const baseUrl = (__ENV.BASE_URL || "https://deladysbeautyworld.com").replace(/\/+$/, "");
const posApiUrl = (__ENV.POS_API_URL || "").replace(/\/+$/, "");
const posApiKey = __ENV.POS_API_KEY || "";

export const options = {
  stages: [
    { duration: "15s", target: 20 },
    { duration: "90s", target: 20 },
    { duration: "15s", target: 0 },
  ],
  thresholds: {
    checks: ["rate>0.98"],
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.02"],
  },
};

export default function () {
  const home = http.get(`${baseUrl}/`);
  check(home, {
    "homepage responds successfully": (response) => response.status === 200,
  });

  const shop = http.get(`${baseUrl}/shop`);
  check(shop, {
    "shop page responds successfully": (response) => response.status === 200,
  });

  if (posApiUrl && posApiKey) {
    const catalog = http.get(`${posApiUrl}/products?page=1&pageSize=12`, {
      headers: { "x-api-key": posApiKey },
    });
    let hasProductList = false;
    if (catalog.status === 200) {
      const body = catalog.json();
      hasProductList = Array.isArray(body) || Array.isArray(body?.products);
    }
    check(catalog, {
      "POS API returns a product list": () => catalog.status === 200 && hasProductList,
    });
  }

  sleep(2);
}
