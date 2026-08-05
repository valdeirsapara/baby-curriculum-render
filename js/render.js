/* ============================================================
   Renders assets/content/content.xml into HTML.
   No dependencies, no build step. Only the XML needs editing.
   ============================================================ */
(function () {
  'use strict';

  var SOURCE = 'assets/content/content.xml';
  var root = document.getElementById('resume');

  // ---------- helpers ----------

  /** Creates an element with an optional class, text and/or children. */
  function el(tag, className, content) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (content == null) return node;
    if (Array.isArray(content)) content.forEach(function (c) { c && node.appendChild(c); });
    else if (content.nodeType) node.appendChild(content);
    else node.textContent = content;
    return node;
  }

  /** Text of a direct <tag> child, or '' when absent. */
  function text(node, tag) {
    var child = node.querySelector(':scope > ' + tag);
    return child ? child.textContent.trim().replace(/\s+/g, ' ') : '';
  }

  /** Direct children matching the given tag. */
  function children(node, tag) {
    return Array.prototype.slice.call(node.querySelectorAll(':scope > ' + tag));
  }

  /** <span class="label">Label:</span> value — with an optional link. */
  function labeledLine(lineClass, labelClass, label, value, href) {
    var line = el('p', lineClass);

    if (label) line.appendChild(el('span', labelClass, label + ': '));

    if (href) {
      var anchor = el('a', null, value);
      anchor.href = href;
      if (/^https?:/i.test(href)) { anchor.target = '_blank'; anchor.rel = 'noopener'; }
      line.appendChild(anchor);
    } else {
      line.appendChild(document.createTextNode(value));
    }

    return line;
  }

  // ---------- blocks ----------

  function buildHeader(personal) {
    if (!personal) return null;

    var header = el('header', 'header');

    var photo = text(personal, 'photo');
    if (photo) {
      var img = el('img', 'header__photo');
      img.src = photo;
      img.alt = 'Foto de ' + text(personal, 'name');
      // drop the image instead of showing a broken-file icon
      img.onerror = function () { img.remove(); };
      header.appendChild(img);
    }

    var info = el('div', 'header__info');
    info.appendChild(el('h1', 'header__name', text(personal, 'name')));

    var role = text(personal, 'role');
    if (role) info.appendChild(el('p', 'header__role', role));

    var fields = children(personal, 'field');
    if (fields.length) {
      var block = el('div', 'fields');
      fields.forEach(function (field) {
        block.appendChild(labeledLine(
          'fields__line', 'fields__label',
          field.getAttribute('label'),
          field.textContent.trim(),
          field.getAttribute('href')
        ));
      });
      info.appendChild(block);
    }

    header.appendChild(info);
    return header;
  }

  function buildEducation(node) {
    var block = el('div', 'education');
    block.appendChild(el('p', 'education__course', text(node, 'course')));

    var meta = [text(node, 'institution'), text(node, 'status')].filter(Boolean).join(' — ');
    if (meta) block.appendChild(el('p', 'education__meta', meta));

    return block;
  }

  function buildExperience(node) {
    var block = el('article', 'experience');

    var head = el('div', 'experience__head');
    head.appendChild(el('span', 'experience__company', text(node, 'company')));

    var period = node.querySelector(':scope > period');
    if (period) {
      var start = period.getAttribute('start') || '';
      var end = period.getAttribute('end') || '';
      head.appendChild(el('span', 'experience__period',
        [start, end].filter(Boolean).join(' – ')));
    }
    block.appendChild(head);

    // one <role> per position held at the company; the optional period=""
    // attribute dates each position separately from the company period above
    children(node, 'role').forEach(function (role) {
      var line = el('p', 'experience__role');
      line.appendChild(el('span', null, role.textContent.trim()));

      var rolePeriod = role.getAttribute('period');
      if (rolePeriod) line.appendChild(el('span', 'experience__role-period', rolePeriod));

      block.appendChild(line);
    });

    // one <activities> block per subheading; title="" is optional
    children(node, 'activities').forEach(function (activities) {
      var groupTitle = activities.getAttribute('title');
      if (groupTitle) block.appendChild(el('h3', 'experience__group', groupTitle));

      var list = el('ul', 'list');
      children(activities, 'item').forEach(function (item) {
        list.appendChild(el('li', null, item.textContent.trim().replace(/\s+/g, ' ')));
      });
      if (list.children.length) block.appendChild(list);
    });

    var technologies = children(node, 'technologies')[0];
    if (technologies) {
      var tags = el('ul', 'techs');
      children(technologies, 'tech').forEach(function (tech) {
        tags.appendChild(el('li', null, tech.textContent.trim()));
      });
      if (tags.children.length) block.appendChild(tags);
    }

    return block;
  }

  function buildSkills(node) {
    var block = el('div', 'pairs');
    children(node, 'group').forEach(function (group) {
      block.appendChild(labeledLine(
        'pairs__line', 'pairs__label',
        group.getAttribute('name'),
        group.textContent.trim().replace(/\s+/g, ' ')
      ));
    });
    return block;
  }

  function buildLinks(node) {
    var block = el('div', 'pairs');
    children(node, 'link').forEach(function (link) {
      block.appendChild(labeledLine(
        'pairs__line', 'pairs__label',
        link.getAttribute('label'),
        link.textContent.trim(),
        link.getAttribute('href')
      ));
    });
    return block;
  }

  /** Which function builds each child type of <section>. */
  var BUILDERS = {
    education:  buildEducation,
    experience: buildExperience,
    skills:     buildSkills,
    links:      buildLinks
  };

  function buildSection(node) {
    var section = el('section', 'section');

    var title = node.getAttribute('title');
    if (title) section.appendChild(el('h2', 'section__title', title));

    // walks the children in the order they appear in the XML
    Array.prototype.forEach.call(node.children, function (child) {
      var build = BUILDERS[child.tagName];
      if (build) section.appendChild(build(child));
    });

    return section;
  }

  /**
   * Footer linking to the XML that generated the page.
   * Uses the absolute URL so the address stays useful in the printed PDF.
   */
  function buildFooter() {
    var url = new URL(SOURCE, location.href).href;

    var footer = el('footer', 'footer');
    footer.appendChild(document.createTextNode('Dados deste currículo em XML: '));

    var anchor = el('a', 'footer__link', url);
    anchor.href = SOURCE;
    footer.appendChild(anchor);

    return footer;
  }

  // ---------- page assembly ----------

  function render(doc) {
    var parseError = doc.querySelector('parsererror');
    if (parseError) throw new Error('XML inválido: ' + parseError.textContent.trim());

    var resume = doc.documentElement;

    document.documentElement.lang = resume.getAttribute('lang') || 'pt-BR';

    var personalNode = resume.querySelector('personal') || resume;
    var name = text(personalNode, 'name');
    var role = text(personalNode, 'role');
    // keep the rendered <title> aligned with the SEO title in index.html so the
    // name stays first when Googlebot indexes the JS-rendered page
    if (name) {
      document.title = role
        ? name + ' — ' + role + ' | Currículo'
        : name + ' — Currículo';
    }

    var frag = document.createDocumentFragment();

    var header = buildHeader(resume.querySelector(':scope > personal'));
    if (header) frag.appendChild(header);

    var summary = text(resume, 'summary');
    if (summary) frag.appendChild(el('p', 'summary', summary));

    children(resume, 'section').forEach(function (section) {
      frag.appendChild(buildSection(section));
    });

    frag.appendChild(buildFooter());

    root.textContent = '';
    root.appendChild(frag);
  }

  function showError(message) {
    var box = el('div', 'error');
    box.appendChild(el('strong', null, 'Não foi possível carregar o currículo.'));
    box.appendChild(el('p', null, message));

    if (location.protocol === 'file:') {
      var hint = el('p', null, 'Você abriu o arquivo direto do disco (file://) e o navegador ' +
        'bloqueia a leitura do XML. Rode um servidor local: ');
      hint.appendChild(el('code', null, 'python3 -m http.server 8000'));
      hint.appendChild(document.createTextNode(' e acesse http://localhost:8000'));
      box.appendChild(hint);
    }

    root.textContent = '';
    root.appendChild(box);
  }

  // ---------- loading ----------

  fetch(SOURCE, { cache: 'no-cache' })
    .then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status + ' ao buscar ' + SOURCE);
      return response.text();
    })
    .then(function (body) {
      render(new DOMParser().parseFromString(body, 'application/xml'));
    })
    .catch(function (error) {
      showError(error.message);
      console.error(error);
    });

  // print button
  var printButton = document.getElementById('print');
  if (printButton) printButton.addEventListener('click', function () { window.print(); });
})();
