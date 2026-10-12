/* shared: cart counter, mobile menu, toast */
(function () {
  var KEY = 'himera-cart';
  function read() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function write(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} }
  var mem = read();
  function count() { var n = 0; for (var k in mem) n += mem[k]; return n; }
  function paint() { document.querySelectorAll('[data-cart]').forEach(function (el) { el.textContent = count(); }); }
  window.cartAdd = function (id) { mem[id] = (mem[id] || 0) + 1; write(mem); paint(); };
  var tt = 0;
  window.toast = function (msg) {
    var t = document.getElementById('toast'); if (!t) return;
    t.textContent = msg; t.classList.add('on'); clearTimeout(tt);
    tt = setTimeout(function () { t.classList.remove('on'); }, 2400);
  };
  document.addEventListener('DOMContentLoaded', paint); paint();
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.menu'); var m = document.getElementById('mnav');
    if (b && m) { var o = m.classList.toggle('open'); b.setAttribute('aria-expanded', o); return; }
    if (m && m.classList.contains('open') && !e.target.closest('#mnav')) { m.classList.remove('open'); var mb = document.querySelector('.menu'); if (mb) mb.setAttribute('aria-expanded', 'false'); }
  });
})();
