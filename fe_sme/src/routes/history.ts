/** Simple browser history navigation utility */

export function navigateTo(path: string): void {
  window.location.href = path;
}

export function goBack(): void {
  window.history.back();
}
