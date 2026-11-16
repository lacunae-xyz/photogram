export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker
        .register('/image-worker.js')
        .catch(error =>
          console.error('Cannot register image-worker.js', error),
        );
    });
  }
}
