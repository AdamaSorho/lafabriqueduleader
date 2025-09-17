document.addEventListener('DOMContentLoaded', function () {
  try {
    var lang = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
    var months = lang.indexOf('fr') === 0
      ? ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
      : ['January','February','March','April','May','June','July','August','September','October','November','December'];

    // Fill all last-updated placeholders
    var d = new Date();
    var formatted = months[d.getMonth()] + ' ' + d.getFullYear();
    document.querySelectorAll('[data-last-updated]').forEach(function (el) {
      el.textContent = formatted;
    });

    // Ensure top anchor exists
    var h1 = document.querySelector('h1');
    if (h1 && !h1.id) h1.id = 'top';

    // Inject minimal styles: smooth scroll, toc, back-to-top button
    var style = document.createElement('style');
    style.textContent = `
      html { scroll-behavior: smooth; }
      .toc { margin: 16px 0 24px; padding: 12px 16px; background: #f7f7f9; border-radius: 8px; }
      .toc ul { margin: 8px 0 0; padding-left: 20px; }
      .toc a { text-decoration: none; }
      .toc a:hover { text-decoration: underline; }
      .back-to-top {
        position: fixed; right: 16px; bottom: 16px;
        background: #0a58ca; color: #fff; text-decoration: none;
        width: 40px; height: 40px; border-radius: 20px;
        display: flex; align-items: center; justify-content: center;
        font-size: 20px; box-shadow: 0 2px 8px rgba(0,0,0,.15);
        opacity: 0; pointer-events: none; transition: opacity .2s ease-in-out;
      }
      .back-to-top.visible { opacity: 0.9; pointer-events: auto; }
      .back-to-top:hover { opacity: 1; }
    `;
    document.head.appendChild(style);

    // Build TOC from headings
    var tocTitle = lang.indexOf('fr') === 0 ? 'Sommaire' : 'Contents';
    var toc = document.querySelector('nav.toc');
    var createdToc = false;
    if (!toc) {
      toc = document.createElement('nav');
      toc.className = 'toc';
      createdToc = true;
    }

    var slugify = function (str) {
      return (str || '')
        .toString()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    };

    var ensureId = function (el) {
      if (el.id) return el.id;
      var base = slugify(el.textContent);
      var id = base || 'section';
      var i = 2;
      while (document.getElementById(id)) {
        id = base + '-' + i;
        i++;
      }
      el.id = id;
      return id;
    };

    var headings = Array.prototype.slice.call(document.querySelectorAll('h2'));
    if (headings.length) {
      var list = headings.map(function (h) {
        var id = ensureId(h);
        return '<li><a href="#' + id + '">' + (h.textContent || id) + '</a></li>';
      }).join('');
      toc.innerHTML = '<strong>' + tocTitle + '</strong><ul>' + list + '</ul>';

      if (createdToc) {
        // Insert TOC after last-updated paragraph or after H1
        var anchorAfter = document.querySelector('p.muted') || h1;
        if (anchorAfter && anchorAfter.parentNode) {
          anchorAfter.parentNode.insertBefore(toc, anchorAfter.nextSibling);
        } else {
          document.body.insertBefore(toc, document.body.firstChild);
        }
      }
    } else if (createdToc) {
      // No headings found and we created a TOC: avoid empty block
      toc.remove();
    }

    // Back to top button
    var btn = document.createElement('a');
    btn.href = '#top';
    btn.className = 'back-to-top';
    btn.setAttribute('aria-label', lang.indexOf('fr') === 0 ? 'Retour en haut' : 'Back to top');
    btn.textContent = '↑';
    document.body.appendChild(btn);

    var onScroll = function () {
      if (window.scrollY > 200) btn.classList.add('visible');
      else btn.classList.remove('visible');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  } catch (e) {
    // fail silently to avoid breaking legal pages
  }
});
