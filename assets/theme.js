(function(){
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var intro = document.getElementById('intro');
  var site = document.getElementById('site');
  var root = document.documentElement;

  if(intro && site){
    root.classList.add('no-scroll');
    function finishIntro(){
      intro.classList.add('hidden');
      site.removeAttribute('aria-hidden');
      root.classList.remove('no-scroll');
    }
    var skipBtn = document.getElementById('introSkip');
    if(skipBtn){ skipBtn.addEventListener('click', finishIntro); }
    setTimeout(finishIntro, reduced ? 250 : 6900);
  }

  var menuToggle = document.getElementById('menuToggle');
  var navLinks = document.getElementById('navLinks');
  if(menuToggle && navLinks){
    menuToggle.addEventListener('click', function(){
      var isOpen = navLinks.classList.toggle('open');
      menuToggle.classList.toggle('active', isOpen);
      menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    navLinks.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        navLinks.classList.remove('open');
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  var revealEnabled = document.body.getAttribute('data-reveal') !== 'false';
  var els = revealEnabled ? document.querySelectorAll('.reveal:not(.in-view)') : document.querySelectorAll('.reveal');
  if(!revealEnabled){
    els.forEach(function(el){ el.classList.add('in-view'); });
  } else if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ e.target.classList.add('in-view'); io.unobserve(e.target); }
      });
    }, {threshold:.15});
    els.forEach(function(el){ io.observe(el); });
  } else {
    els.forEach(function(el){ el.classList.add('in-view'); });
  }

  if(window.matchMedia('(pointer:fine)').matches && !reduced){
    var dot = document.getElementById('cursorDot');
    if(dot){
      window.addEventListener('mousemove', function(e){
        dot.classList.add('live');
        dot.style.top = e.clientY + 'px';
        dot.style.left = e.clientX + 'px';
      });
      document.querySelectorAll('a, button').forEach(function(el){
        el.addEventListener('mouseenter', function(){ dot.classList.add('hover'); });
        el.addEventListener('mouseleave', function(){ dot.classList.remove('hover'); });
      });
    }
  }

  /* ================= CART ================= */
  function formatMoney(cents){
    return (cents/100).toFixed(2).replace('.', ',') + ' ZŁ';
  }

  function setCartCount(count){
    document.querySelectorAll('.cart-count').forEach(function(el){ el.textContent = count; });
  }

  function refreshCartCount(){
    fetch('/cart.js', {headers:{'Accept':'application/json'}})
      .then(function(r){ return r.json(); })
      .then(function(cart){ setCartCount(cart.item_count); })
      .catch(function(){});
  }
  refreshCartCount();

  /* Quick-add "+" buttons on product grids (homepage + collection) */
  document.querySelectorAll('[data-quick-add]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var variantId = btn.getAttribute('data-variant-id');
      if(!variantId){ return; }
      btn.disabled = true;
      var original = btn.textContent;
      fetch('/cart/add.js', {
        method:'POST',
        headers:{'Content-Type':'application/json','Accept':'application/json'},
        body: JSON.stringify({id: variantId, quantity: 1})
      })
      .then(function(r){
        if(!r.ok){ throw new Error('add-failed'); }
        return r.json();
      })
      .then(function(){
        btn.textContent = '✓';
        refreshCartCount();
        setTimeout(function(){ btn.textContent = original; btn.disabled = false; }, 1200);
      })
      .catch(function(){
        btn.textContent = '×';
        setTimeout(function(){ btn.textContent = original; btn.disabled = false; }, 1400);
      });
    });
  });

  /* Cart button in header -> go to cart page */
  document.querySelectorAll('[data-cart-link]').forEach(function(btn){
    btn.addEventListener('click', function(){ window.location.href = '/cart'; });
  });

  /* ================= PRODUCT PAGE ================= */
  var productForm = document.querySelector('[data-product-form]');
  if(productForm){
    var variantSelect = productForm.querySelector('[data-variant-select]');
    var addBtn = productForm.querySelector('[data-add-btn]');
    var addStatus = productForm.querySelector('[data-add-status]');
    var priceEl = document.querySelector('[data-product-price]');
    var comparePriceEl = document.querySelector('[data-product-compare-price]');
    var mediaEl = document.querySelector('[data-product-media-img]');

    if(variantSelect){
      variantSelect.addEventListener('change', function(){
        var opt = variantSelect.options[variantSelect.selectedIndex];
        var available = opt.getAttribute('data-available') === 'true';
        if(addBtn){
          addBtn.disabled = !available;
          addBtn.textContent = available ? addBtn.getAttribute('data-label-add') : addBtn.getAttribute('data-label-sold');
        }
        if(priceEl){ priceEl.textContent = formatMoney(parseInt(opt.getAttribute('data-price'), 10)); }
        if(comparePriceEl){
          var cmp = opt.getAttribute('data-compare-price');
          if(cmp && parseInt(cmp,10) > parseInt(opt.getAttribute('data-price'),10)){
            comparePriceEl.textContent = formatMoney(parseInt(cmp,10));
            comparePriceEl.style.display = '';
          } else {
            comparePriceEl.style.display = 'none';
          }
        }
        var img = opt.getAttribute('data-image');
        if(mediaEl && img){ mediaEl.setAttribute('src', img); }
      });
    }

    productForm.addEventListener('submit', function(e){
      e.preventDefault();
      if(addBtn){ addBtn.disabled = true; }
      if(addStatus){ addStatus.textContent = 'DODAJĘ…'; addStatus.classList.remove('ok'); }
      var formData = new FormData(productForm);
      fetch('/cart/add.js', {
        method:'POST',
        headers:{'Accept':'application/json'},
        body: formData
      })
      .then(function(r){ return r.json().then(function(data){ return {ok:r.ok, data:data}; }); })
      .then(function(res){
        if(!res.ok){ throw new Error((res.data && res.data.description) || 'Błąd dodawania do koszyka'); }
        if(addStatus){ addStatus.textContent = 'DODANO DO KOSZYKA ✓'; addStatus.classList.add('ok'); }
        refreshCartCount();
        if(addBtn){ addBtn.disabled = false; }
      })
      .catch(function(err){
        if(addStatus){ addStatus.textContent = 'NIEDOSTĘPNE / BŁĄD'; addStatus.classList.remove('ok'); }
        if(addBtn){ addBtn.disabled = false; }
      });
    });
  }

  /* Thumbnail swap on product page */
  document.querySelectorAll('[data-thumb]').forEach(function(a){
    a.addEventListener('click', function(e){
      e.preventDefault();
      var mediaEl = document.querySelector('[data-product-media-img]');
      if(mediaEl){ mediaEl.setAttribute('src', a.getAttribute('href')); }
      document.querySelectorAll('[data-thumb]').forEach(function(t){ t.classList.remove('active'); });
      a.classList.add('active');
    });
  });
})();
