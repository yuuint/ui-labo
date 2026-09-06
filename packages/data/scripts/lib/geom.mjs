/** 多角形まわりの最小限の道具。外部依存を持たない */

/** 符号つき面積。向きの判定に使う（穴リングは外周と逆向き） */
export const signedArea = (r) => {
  let s = 0;
  for (let i = 0; i < r.length - 1; i++) s += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1];
  return s / 2;
};
export const area = (r) => Math.abs(signedArea(r));
/** 頂点の平均。島を落とす判定などの粗い用途に使う */
export const centroid = (r) => [
  r.reduce((s, p) => s + p[0], 0) / r.length,
  r.reduce((s, p) => s + p[1], 0) / r.length,
];

/**
 * 面積重心。頂点の平均だと、頂点が密な側（入り組んだ海岸線）へ寄ってしまう。
 * 目印を図形の真ん中に置くにはこちらが要る。
 */
export function polygonCentroid(ring) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x0, y0] = ring[i], [x1, y1] = ring[i + 1];
    const f = x0 * y1 - x1 * y0;
    a += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f;
  }
  if (a === 0) return centroid(ring);
  return [cx / (3 * a), cy / (3 * a)];
}

/** 複数リングの面積重み付き重心 */
export function ringsCentroid(rings) {
  let wsum = 0, cx = 0, cy = 0;
  for (const r of rings) {
    const w = area(r);
    const [x, y] = polygonCentroid(r);
    cx += x * w; cy += y * w; wsum += w;
  }
  return wsum ? [cx / wsum, cy / wsum] : centroid(rings[0]);
}

/** Douglas-Peucker。頂点を減らす */
export function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Array(pts.length).fill(false);
  keep[0] = keep[pts.length - 1] = true;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, dd = dx * dx + dy * dy;
    let best = -1, bi = -1;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = pts[i];
      let d;
      if (dd === 0) d = (px - ax) ** 2 + (py - ay) ** 2;
      else {
        const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / dd));
        d = (px - ax - t * dx) ** 2 + (py - ay - t * dy) ** 2;
      }
      if (d > best) { best = d; bi = i; }
    }
    if (best > tol * tol) { keep[bi] = true; stack.push([a, bi], [bi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

/** Chaikin の角落とし。輪郭を丸める（堅い直線を避けるため） */
export function chaikin(ring, iterations = 2) {
  let pts = ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
    ? ring.slice(0, -1) : ring.slice();
  for (let k = 0; k < iterations; k++) {
    if (pts.length < 4) break;
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
      out.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25]);
      out.push([ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]);
    }
    pts = out;
  }
  return [...pts, pts[0]];
}
