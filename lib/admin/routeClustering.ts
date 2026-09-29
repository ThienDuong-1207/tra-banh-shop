// Tính khoảng cách km thật giữa 2 toạ độ (công thức haversine) + gom cụm đơn
// giao hàng gần nhau thành "tuyến" — dùng ở ShipperClient (gom đơn "Đang xử
// lý" chưa ai nhận) để shipper nhận nguyên 1 tuyến thay vì từng đơn lẻ.
export function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const DEFAULT_CLUSTER_RADIUS_KM = 3;

// Gom cụm kiểu tham lam: lấy 1 đơn làm "tâm", gom hết các đơn còn lại trong
// bán kính radiusKm vào cùng cụm, lặp lại với phần còn dư — đơn giản, dễ hiểu
// hơn thuật toán tối ưu tuyến đường (TSP) thật sự, đủ dùng cho quy mô 1 tiệm
// nhỏ với vài shipper. Không đổi thứ tự `items` đầu vào ngoài việc nhóm lại.
export function clusterByDistance<T extends { lat: number; lng: number }>(
  items: T[],
  radiusKm: number = DEFAULT_CLUSTER_RADIUS_KM
): T[][] {
  const remaining = [...items];
  const clusters: T[][] = [];
  while (remaining.length > 0) {
    const seed = remaining.shift()!;
    const cluster = [seed];
    for (let i = remaining.length - 1; i >= 0; i--) {
      if (haversineDistanceKm(seed.lat, seed.lng, remaining[i].lat, remaining[i].lng) <= radiusKm) {
        cluster.push(remaining[i]);
        remaining.splice(i, 1);
      }
    }
    clusters.push(cluster);
  }
  return clusters;
}
