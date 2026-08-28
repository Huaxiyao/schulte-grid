export function shuffled(n) {
  const a = [];
  for (let i = 1; i <= n; i++) a.push(i);
  for (let j = a.length - 1; j > 0; j--) {
    const k = Math.floor(Math.random() * (j + 1));
    const tmp = a[j]; a[j] = a[k]; a[k] = tmp;
  }
  return a;
}

export function ratingFor(secPerCell) {
  if (secPerCell < 1.0) return '行云流水';
  if (secPerCell < 1.5) return '渐入佳境';
  if (secPerCell < 2.5) return '稳扎稳打';
  return '初窥门径';
}

export function fmt(t) {
  return t.toFixed(2);
}
