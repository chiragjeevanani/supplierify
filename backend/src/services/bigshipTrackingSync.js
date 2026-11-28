import env from '../config/env.js';
import bigshipFulfillmentService from './bigshipFulfillmentService.js';

let timer = null;
let running = false;

/**
 * Bigship has no webhooks, so shipment status is pulled on a timer:
 * every BIGSHIP_TRACK_SYNC_MINUTES (default 30) we sync shipments that have an AWB and aren't finished.
 * Does nothing when Bigship isn't configured or the interval is 0.
 */
export function startBigshipTrackingSync() {
  const minutes = Number(env.BIGSHIP.TRACK_SYNC_MINUTES);
  if (timer || !env.BIGSHIP.IS_CONFIGURED || !Number.isFinite(minutes) || minutes <= 0) return;

  const run = async () => {
    if (running) return; // never overlap two runs
    running = true;
    try {
      const r = await bigshipFulfillmentService.syncActiveShipments();
      if (r?.checked) console.log(`[Bigship Sync] checked=${r.checked} ok=${r.ok} failed=${r.failed}`);
    } catch (e) {
      console.warn('[Bigship Sync] run failed:', e.message);
    } finally {
      running = false;
    }
  };

  timer = setInterval(run, minutes * 60 * 1000);
  timer.unref?.(); // don't keep the process alive just for this
  setTimeout(run, 2 * 60 * 1000).unref?.(); // first pass shortly after boot
  console.log(`[Bigship Sync] Tracking sync every ${minutes} min`);
}

export default { startBigshipTrackingSync };
