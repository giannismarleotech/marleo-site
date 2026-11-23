/* Large HQ snapshots belong in IndexedDB, independently of cloud writes.
   Authentication remains in Supabase's own storage. No token keys are touched. */
(function (root) {
  'use strict';
  var legacyKey = 'marleo_hq_v1', oldKey = 'marleo_crm_v2';
  var connection, queue = Promise.resolve(), owner = null;
  function notice(warning) {
    var el = document.getElementById('localCacheStatus');
    if (!el && warning) {
      var anchor = document.getElementById('cloudStatus');
      if (!anchor) return;
      el = document.createElement('div'); el.id = 'localCacheStatus';
      el.setAttribute('role', 'status'); el.style.cssText = 'font-size:12px;color:#fbbf24;padding:6px 12px';
      anchor.after(el);
    }
    if (el) { el.hidden = !warning; el.textContent = warning || ''; }
  }
  function open() {
    if (!connection) connection = new Promise(function (resolve, reject) {
      if (!root.indexedDB) return reject(new Error('IndexedDB unavailable'));
      var req = root.indexedDB.open('marleo-hq-cache', 1);
      req.onupgradeneeded = function () { req.result.createObjectStore('snapshots'); };
      req.onsuccess = function () {
        var db = req.result;
        db.onversionchange = function () { db.close(); connection = null; };
        resolve(db);
      };
      req.onerror = function () { connection = null; reject(req.error); };
      req.onblocked = function () { connection = null; reject(new Error('Cache upgrade blocked')); };
    });
    return connection;
  }
  async function read(key) {
    var db = await open();
    return new Promise(function (resolve, reject) {
      var tx = db.transaction('snapshots', 'readonly'), req = tx.objectStore('snapshots').get(key);
      tx.oncomplete = function () { resolve(req.result); };
      tx.onabort = tx.onerror = function () { reject(tx.error || new Error('Cache read failed')); };
    });
  }
  async function write(key, value, backups) {
    var db = await open();
    return new Promise(function (resolve, reject) {
      var tx = db.transaction('snapshots', 'readwrite');
      var store = tx.objectStore('snapshots');
      store.put(value, key);
      (backups || []).forEach(function (b) { store.put(b.raw, b.key); });
      tx.oncomplete = function () { resolve(); };
      tx.onabort = tx.onerror = function () { reject(tx.error || new Error('Cache write failed')); };
    });
  }
  function serial(task) {
    var result = queue.then(task); queue = result.catch(function () {}); return result;
  }
  async function prepare(uid) {
    owner = uid;
    return serial(async function () {
      try {
        // Archive legacy copies before releasing their limited localStorage space.
        // Keep the original intact if the transaction fails or it changes meanwhile.
        var latestLegacy = null;
        for (var key of [legacyKey, oldKey]) {
          var raw;
          try { raw = root.localStorage.getItem(key); } catch (_) { continue; }
          if (raw) {
            if (!latestLegacy) {
              var parsed = JSON.parse(raw);
              if (!parsed || !Array.isArray(parsed.customers)) throw new Error('Invalid legacy snapshot');
              await write('owner:' + uid, parsed, [{key:'legacy-backup:' + uid + ':' + key, raw:raw}]);
              latestLegacy = raw;
            } else await write('legacy-backup:' + uid + ':' + key, raw);
            try { if (root.localStorage.getItem(key) === raw) root.localStorage.removeItem(key); } catch (_) {}
          }
        }
        // A newly migrated fallback can contain edits newer than the last IDB save.
        var cached = latestLegacy ? JSON.parse(latestLegacy) : await read('owner:' + uid);
        if (!cached) {
          var backup = await read('legacy-backup:' + uid + ':' + legacyKey) || await read('legacy-backup:' + uid + ':' + oldKey);
          if (backup) cached = JSON.parse(backup);
        }
        notice(null); return cached || null;
      } catch (_) {
        notice('Lokale reservekopie niet beschikbaar. Controleer de cloudstatus vóór je afsluit.');
        return null;
      }
    });
  }
  function save(data) {
    // Capture immediately, so later edits cannot change a queued snapshot.
    var snapshot, uid = owner;
    try { snapshot = JSON.parse(JSON.stringify(data)); } catch (_) { return Promise.resolve(false); }
    return serial(async function () {
      try {
        if (!uid) throw new Error('Not signed in');
        var backups = [];
        for (var key of [legacyKey, oldKey]) {
          try { var raw = root.localStorage.getItem(key); if (raw) backups.push({original:key, key:'legacy-backup:' + uid + ':' + key, raw:raw}); } catch (_) {}
        }
        await write('owner:' + uid, snapshot, backups);
        backups.forEach(function (b) { try { if (root.localStorage.getItem(b.original) === b.raw) root.localStorage.removeItem(b.original); } catch (_) {} });
        notice(null); return true;
      } catch (_) {
        try { root.localStorage.setItem(legacyKey, JSON.stringify(snapshot)); notice(null); return true; }
        catch (_) {
          notice('Lokale reservekopie kon niet worden bijgewerkt. Controleer de cloudstatus vóór je afsluit.');
          return false; // A cache failure must never reject a successful cloud operation.
        }
      }
    });
  }
  root.HQCache = {prepare: prepare, save: save};
})(window);
