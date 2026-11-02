/* Public browser configuration. Account permissions are enforced by Supabase RLS. */
window.APP_CONFIG = {
  supabaseUrl: 'https://vnnhyhicppkexdibuqyu.supabase.co',
  supabaseKey: 'sb_publishable_sNNNyEu6D9_Sjy0O0MaS5Q_VyReD7Tj',
  workerUrl: 'https://woerterbuch-bilder.edwin1kitaka.workers.dev',
  readOnly: ['localhost','127.0.0.1','[::1]'].includes(location.hostname) || location.protocol === 'file:'
};
window.CONFIG_READY = (async () => {
  if (!APP_CONFIG.readOnly || location.protocol === 'file:') return;
  try {
    const response = await fetch('config.local.json', {cache:'no-store'});
    if (!response.ok) return;
    const config = await response.json();
    const distinct = name => typeof config[name] === 'string' && config[name] !== APP_CONFIG[name] &&
      new URL(config[name]).protocol === 'https:';
    if (config.environment !== 'staging' || !distinct('supabaseUrl') || !distinct('workerUrl') ||
        typeof config.supabaseKey !== 'string' || !config.supabaseKey.startsWith('sb_publishable_')) return;
    for (const name of ['supabaseUrl','supabaseKey','workerUrl']) APP_CONFIG[name] = config[name].replace(/\/$/,'');
    APP_CONFIG.readOnly = false;
  } catch { /* An absent local override leaves the preview read-only. */ }
})();
function assertWritable() {
  if (APP_CONFIG.readOnly) throw new Error('This local preview is read-only. Configure isolated staging services to test account changes.');
}
