/**
 * NARRATIQ → SHINING LEGACY WEBHOOK
 * ===================================
 * Déployer sur Vercel (api/webhook.js)
 *
 * Ce webhook :
 * 1. Reçoit un article JSON de Narratiq
 * 2. Génère un fichier HTML complet (UX/UI Shining Legacy)
 * 3. Pousse le fichier HTML sur GitHub
 * 4. Met à jour blog.html (injecte la carte en tête du grid)
 * 5. Vercel redéploie automatiquement via GitHub push
 *
 * VARIABLES D'ENVIRONNEMENT (Vercel dashboard > Settings > Env):
 *   GITHUB_TOKEN    = ghp_xxxx  (Personal Access Token, scope: repo)
 *   GITHUB_OWNER    = Aiproject77
 *   GITHUB_REPO     = shininglegacy  (ou le vrai nom du repo)
 *   WEBHOOK_SECRET  = un_secret_partage_avec_narratiq
 */

// ─── Utilities ───────────────────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

function escHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(ds) {
  return new Date(ds || Date.now()).toLocaleDateString('en-CA', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

function shortDate(ds) {
  return new Date(ds || Date.now()).toLocaleDateString('en-CA', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

function readingTime(content) {
  const words = (content || '').replace(/<[^>]+>/g, '').split(/\s+/).length;
  return `${Math.max(8, Math.ceil(words / 200))} min read`;
}

// ─── Article HTML (full page) ────────────────────────────────────────────────
function generateArticleHTML(a) {
  const {
    title, category, excerpt, content,
    image_url, image_alt, date, slug,
    city_focus, keywords = []
  } = a;

  const cityLine = city_focus
    ? `${city_focus}, Toronto, Mississauga, Brampton, Etobicoke, Vaughan & Durham`
    : 'Toronto, Mississauga, Brampton, Etobicoke, Vaughan, Durham & Clarington';

  const rt = readingTime(content);
  const kw = keywords.join(', ');
  const fd = formatDate(date);
  const dt = date || new Date().toISOString().slice(0, 10);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(title)} | ${city_focus || 'GTA'} | Shining Legacy</title>
  <meta name="description" content="${escHtml(excerpt)}">
  <meta name="keywords" content="${escHtml(kw)}, commercial cleaning ${city_focus || 'GTA'}, office cleaning Toronto, Shining Legacy">
  <meta name="author" content="Shining Legacy Commercial Cleaning">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://shininglegacy.ca/${slug}.html">
  <meta property="og:title" content="${escHtml(title)}">
  <meta property="og:description" content="${escHtml(excerpt)}">
  <meta property="og:image" content="${image_url}">
  <meta property="og:type" content="article">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    :root{--navy:#1a3a52;--navy2:#15293d;--green:#5cb85c;--green-lt:#e8f5e9;--off:#f5f6f8;--white:#fff;--muted:#6b7280;--border:#e5e7eb;--radius:10px;--shadow:0 2px 8px rgba(0,0,0,.06);--tr:all .2s ease;--nav-h:70px}
    html{scroll-behavior:smooth}
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#374151}
    a{color:var(--green);text-decoration:none;font-weight:600}
    a:hover{color:var(--navy)}
    img{max-width:100%;height:auto}
    .container{max-width:1200px;margin:0 auto;padding:0 24px}
    h1,h2,h3,h4{font-family:"Poppins",sans-serif;font-weight:800;color:var(--navy);line-height:1.25}
    h1{font-size:clamp(1.8rem,4.5vw,2.8rem);margin-bottom:12px}
    h2{font-size:1.45rem;margin:40px 0 14px}
    h3{font-size:1.1rem;margin:24px 0 8px}
    strong{font-weight:700;color:var(--navy)}
    ul,ol{margin:16px 0 20px 20px;line-height:1.8}
    li{margin-bottom:8px}
    p{margin-bottom:16px}
    blockquote{border-left:4px solid var(--green);padding:16px 20px;background:var(--green-lt);border-radius:0 8px 8px 0;margin:24px 0;font-style:italic;color:var(--navy)}
    nav{position:fixed;top:0;left:0;right:0;height:var(--nav-h);background:var(--white);border-bottom:1px solid var(--border);z-index:100;display:flex;align-items:center;padding:0 24px;gap:32px;box-shadow:var(--shadow)}
    .nav-logo{height:44px;flex-shrink:0}
    .nav-links{display:flex;gap:24px;margin-left:auto;align-items:center}
    .nav-links a{font-size:.88rem;font-weight:600;color:var(--muted);transition:var(--tr)}
    .nav-links a:hover{color:var(--navy)}
    .nav-phone{display:flex;align-items:center;gap:6px;color:var(--green);font-weight:700;font-size:.9rem;white-space:nowrap}
    .btn-primary{background:var(--green);color:var(--white);padding:10px 20px;border-radius:8px;font-weight:700;font-size:.88rem;white-space:nowrap;transition:var(--tr);display:inline-flex;align-items:center;gap:6px}
    .btn-primary:hover{opacity:.9;color:var(--white)}
    .btn-secondary{background:rgba(255,255,255,.1);color:var(--white);border:1.5px solid rgba(255,255,255,.3);padding:10px 20px;border-radius:8px;font-weight:700;font-size:.88rem;display:inline-flex;align-items:center;gap:6px;transition:var(--tr)}
    .btn-secondary:hover{background:rgba(255,255,255,.2);color:var(--white)}
    .hamburger{display:none;flex-direction:column;gap:5px;cursor:pointer;padding:4px;margin-left:auto}
    .hamburger span{display:block;width:22px;height:2px;background:var(--navy);border-radius:2px}
    .article-header{background:linear-gradient(135deg,var(--navy) 0%,var(--navy2) 100%);padding:calc(var(--nav-h) + 48px) 0 56px;color:var(--white)}
    .breadcrumb{display:flex;gap:8px;font-size:.82rem;margin-bottom:20px;flex-wrap:wrap}
    .breadcrumb a{color:rgba(255,255,255,.7);font-weight:400}
    .breadcrumb span{color:rgba(255,255,255,.35)}
    .article-badge{display:inline-block;background:rgba(92,184,92,.2);border:1px solid rgba(92,184,92,.5);color:var(--green);padding:5px 14px;border-radius:30px;font-size:.74rem;font-weight:700;margin-bottom:16px;text-transform:uppercase;letter-spacing:.06em}
    .article-header h1{color:var(--white)}
    .article-header p{color:rgba(255,255,255,.75);font-size:.95rem;margin-top:10px;max-width:680px}
    .article-body{max-width:780px;margin:0 auto;padding:56px 24px 80px}
    .article-meta{display:flex;align-items:center;gap:14px;padding-bottom:24px;border-bottom:2px solid var(--border);margin-bottom:40px;flex-wrap:wrap;color:var(--muted);font-size:.85rem}
    .article-meta-dot{color:var(--border)}
    .hero-img{width:100%;border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.1);margin-bottom:8px;object-fit:cover;height:420px}
    .img-caption{font-size:.78rem;color:var(--muted);text-align:center;margin-bottom:32px}
    .tip-box{background:var(--green-lt);border:1.5px solid rgba(92,184,92,.4);border-radius:10px;padding:20px 24px;margin:28px 0}
    .tip-box-title{font-family:"Poppins",sans-serif;font-weight:700;color:var(--navy);margin-bottom:6px;font-size:.9rem}
    .stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:32px 0}
    .stat-card{background:var(--off);border-radius:10px;padding:20px;text-align:center;border:1.5px solid var(--border)}
    .stat-num{font-family:"Poppins",sans-serif;font-size:1.8rem;font-weight:800;color:var(--green);margin-bottom:4px}
    .stat-lbl{font-size:.8rem;color:var(--muted);font-weight:600}
    .cta-box{background:linear-gradient(135deg,var(--navy),var(--navy2));border-radius:14px;padding:36px;text-align:center;margin:48px 0;color:var(--white)}
    .cta-box h3{color:var(--white);margin-bottom:10px;font-size:1.25rem}
    .cta-box p{color:rgba(255,255,255,.8);margin-bottom:20px;font-size:.92rem}
    .related{border-top:2px solid var(--border);padding-top:40px;margin-top:48px}
    .related-title{font-family:"Poppins",sans-serif;font-size:1.05rem;font-weight:700;color:var(--navy);margin-bottom:20px}
    .related-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
    .related-card{background:var(--off);border:1.5px solid var(--border);border-radius:10px;padding:18px;transition:var(--tr);display:block}
    .related-card:hover{border-color:var(--green);transform:translateY(-2px)}
    .related-cat{font-size:.72rem;font-weight:700;color:var(--green);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
    .related-card h4{font-family:"Poppins",sans-serif;font-size:.9rem;font-weight:700;color:var(--navy);margin-bottom:4px;line-height:1.35}
    .related-card p{font-size:.78rem;color:var(--muted);margin:0}
    footer{background:var(--navy);color:var(--white);padding:48px 0 28px}
    .footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px;margin-bottom:32px}
    .footer-brand{font-size:.85rem;color:rgba(255,255,255,.55);line-height:1.8;margin-top:8px}
    .footer-col h4{font-family:"Poppins",sans-serif;font-size:.78rem;font-weight:700;color:var(--green);text-transform:uppercase;letter-spacing:.08em;margin-bottom:14px}
    .footer-col a{display:block;font-size:.82rem;color:rgba(255,255,255,.6);margin-bottom:8px;font-weight:400;transition:var(--tr)}
    .footer-col a:hover{color:var(--white)}
    .footer-bottom{border-top:1px solid rgba(255,255,255,.12);padding-top:20px;display:flex;justify-content:space-between;align-items:center;font-size:.8rem;color:rgba(255,255,255,.4);flex-wrap:wrap;gap:10px}
    @media(max-width:768px){
      nav{padding:0 16px}
      .nav-links{display:none}
      .hamburger{display:flex}
      .nav-links.open{display:flex;flex-direction:column;position:fixed;top:var(--nav-h);left:0;right:0;background:var(--white);border-bottom:1px solid var(--border);padding:16px 24px;gap:12px;box-shadow:0 8px 24px rgba(0,0,0,.1);z-index:99}
      .article-body{padding:40px 16px 60px}
      h2{font-size:1.2rem;margin:32px 0 12px}
      .hero-img{height:220px}
      .stat-row{grid-template-columns:1fr}
      .related-grid{grid-template-columns:1fr}
      .footer-grid{grid-template-columns:1fr 1fr}
      .footer-bottom{flex-direction:column;text-align:center}
    }
    @media(max-width:400px){
      .footer-grid{grid-template-columns:1fr}
    }
  </style>
</head>
<body>

<nav>
  <a href="index.html" style="display:flex;align-items:center;gap:8px;text-decoration:none">
    <img src="https://shininglegacy.vercel.app/shininglegacylogo1-removebg-preview.png" alt="Shining Legacy" style="height:44px" onerror="this.style.display='none'">
    <span style="font-family:Poppins,sans-serif;font-weight:800;font-size:1rem;color:var(--navy);line-height:1.1">Shining Legacy<br><span style="font-size:.65rem;font-weight:600;color:var(--green);letter-spacing:.04em">COMMERCIAL CLEANING</span></span>
  </a>
  <div class="nav-links" id="nav-links">
    <a href="services.html">Services</a>
    <a href="about.html">About</a>
    <a href="services.html">What We Clean</a>
    <a href="checklist.html">Free Checklist</a>
    <a href="blog.html">Blog</a>
    <a href="contact.html">Contact</a>
    <a class="nav-phone" href="tel:4377811769">
      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z"/></svg>
      (437) 781-1769
    </a>
    <a href="quote.html" class="btn-primary">Free Quote</a>
  </div>
  <div class="hamburger" id="hamburger" onclick="toggleNav()">
    <span></span><span></span><span></span>
  </div>
</nav>

<div class="article-header">
  <div class="container">
    <div class="breadcrumb">
      <a href="index.html">Home</a><span>/</span>
      <a href="blog.html">Blog</a><span>/</span>
      <strong style="color:rgba(255,255,255,.9)">${escHtml(category)}</strong>
    </div>
    <div style="max-width:780px">
      <span class="article-badge">${escHtml(category)}</span>
      <h1>${escHtml(title)}</h1>
      <p>${escHtml(excerpt)}</p>
    </div>
  </div>
</div>

<article class="article-body" itemscope itemtype="https://schema.org/NewsArticle">
  <meta itemprop="headline" content="${escHtml(title)}">
  <meta itemprop="datePublished" content="${dt}">
  <meta itemprop="author" content="Shining Legacy Commercial Cleaning">

  <div class="article-meta">
    <span>${rt}</span>
    <span class="article-meta-dot">·</span>
    <span>${fd}</span>
    <span class="article-meta-dot">·</span>
    <span>Shining Legacy</span>
  </div>

  <img class="hero-img" src="${image_url}" alt="${escHtml(image_alt || title)}" loading="eager">
  <p class="img-caption">Professional cleaning services across ${cityLine}</p>

  ${content}

  <div class="cta-box">
    <h3>Get a Free Professional Cleaning Quote</h3>
    <p>Serving ${cityLine}. WHMIS-compliant. Fully insured. Same-day response.</p>
    <a href="quote.html" class="btn-primary">
      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
      Get Your Free Quote
    </a>
    <a href="checklist.html" class="btn-secondary" style="margin-left:10px">
      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
      Free Inspection Checklist
    </a>
  </div>

  <p style="font-size:.82rem;color:var(--muted);text-align:center;line-height:1.85">
    <strong>Shining Legacy Commercial Cleaning Inc.</strong><br>
    Serving ${cityLine}<br>
    WHMIS-compliant &bull; Fully Insured &bull; 24/7 Support &bull; (437) 781-1769 &bull;
    <a href="contact.html">contact us</a>
  </p>

  <div class="related">
    <p class="related-title">Related Articles</p>
    <div class="related-grid">
      <a href="article-office-mistakes.html" class="related-card">
        <div class="related-cat">Professional Tips</div>
        <h4>5 Office Cleaning Mistakes Companies Make</h4>
        <p>Hidden costs and how to fix them today</p>
      </a>
      <a href="article-inspection-checklist-leadmagnet.html" class="related-card">
        <div class="related-cat">Free Resource</div>
        <h4>Free 60-Point Inspection Checklist</h4>
        <p>Evaluate your cleaning quality in 15 minutes</p>
      </a>
    </div>
  </div>
</article>

<footer>
  <div class="container">
    <div class="footer-grid">
      <div>
        <img src="shininglegacylogo1-removebg-preview.png" alt="Shining Legacy" style="height:48px;filter:brightness(0) invert(1);margin-bottom:14px">
        <p class="footer-brand">Professional commercial cleaning across the GTA, Mississauga, Brampton, Etobicoke, Vaughan, Durham &amp; Clarington. WHMIS-compliant. Fully insured.</p>
      </div>
      <div class="footer-col">
        <h4>Services</h4>
        <a href="services.html">Office Cleaning</a>
        <a href="services.html">Medical Cleaning</a>
        <a href="services.html">Post-Construction</a>
        <a href="services.html">Industrial</a>
      </div>
      <div class="footer-col">
        <h4>Company</h4>
        <a href="about.html">About Us</a>
        <a href="checklist.html">Free Checklist</a>
        <a href="blog.html">Blog</a>
        <a href="contact.html">Contact</a>
      </div>
      <div class="footer-col">
        <h4>Contact</h4>
        <a href="tel:4377811769">(437) 781-1769</a>
        <a href="mailto:info@shininglegacy.ca">info@shininglegacy.ca</a>
        <a href="quote.html">Free Quote</a>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; 2026 Shining Legacy Commercial Cleaning Inc. All rights reserved.</span>
      <div style="display:flex;gap:16px">
        <a href="privacy.html" style="color:rgba(255,255,255,.4)">Privacy</a>
        <a href="sitemap.xml" style="color:rgba(255,255,255,.4)">Sitemap</a>
      </div>
    </div>
  </div>
</footer>

<script>
function toggleNav(){document.getElementById('nav-links').classList.toggle('open')}
document.addEventListener('click',function(e){
  var n=document.getElementById('nav-links'),h=document.getElementById('hamburger');
  if(n.classList.contains('open')&&!n.contains(e.target)&&!h.contains(e.target))n.classList.remove('open');
});
</script>
</body>
</html>`;
}

// ─── Blog Card ────────────────────────────────────────────────────────────────
function generateBlogCard(a) {
  const { title, category, excerpt, image_url, image_alt, date, slug } = a;
  const rt = readingTime(a.content);
  return `<a href="${slug}.html" class="blog-card">
  <div class="bci">
    <img src="${image_url}" alt="${escHtml(image_alt || title)}" loading="lazy">
    <span class="bci-badge">${escHtml(category)}</span>
  </div>
  <div class="bcb">
    <div class="bcm">
      <span class="bcm-date">${shortDate(date)}</span>
      <span style="color:var(--border)">·</span>
      <span class="bcm-read">${rt}</span>
    </div>
    <h3>${escHtml(title)}</h3>
    <p>${escHtml(excerpt)}</p>
    <div class="bcf">
      <div class="bca">
        <div class="bca-ico"><svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg></div>
        <span>Shining Legacy</span>
      </div>
      <span class="bcr">Read more <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg></span>
    </div>
  </div>
</a>`;
}

// ─── GitHub API ───────────────────────────────────────────────────────────────
async function ghGet(path) {
  const r = await fetch(
    `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/${path}`,
    { headers: { Authorization: `token ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' } }
  );
  return r.ok ? r.json() : null;
}

async function ghPush(path, content, message, sha) {
  const body = { message, content: Buffer.from(content, 'utf8').toString('base64') };
  if (sha) body.sha = sha;
  const r = await fetch(
    `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  );
  const data = await r.json();
  if (!r.ok) throw new Error(`GitHub push failed: ${JSON.stringify(data)}`);
  return data;
}

// ─── Handler ──────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  // CORS headers — allow browser-based testing tools
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-narratiq-secret, x-webhook-secret');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secret = req.headers['x-narratiq-secret'] || req.headers['x-webhook-secret'];
  if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized — invalid secret' });
  }

  try {
    const a = req.body;

    // Validate
    for (const f of ['title', 'content', 'excerpt', 'category', 'image_url']) {
      if (!a[f]) return res.status(400).json({ error: `Missing required field: ${f}` });
    }

    a.slug  = a.slug || slugify(a.title);
    a.date  = a.date || new Date().toISOString().slice(0, 10);

    // 1 — Article HTML
    const articleHTML = generateArticleHTML(a);
    const articlePath = `${a.slug}.html`;
    const existing    = await ghGet(articlePath);
    await ghPush(articlePath, articleHTML, `feat(blog): publish "${a.title}"`, existing?.sha);

    // 2 — Inject card into blog.html
    const blogFile = await ghGet('blog.html');
    if (blogFile) {
      let html = Buffer.from(blogFile.content, 'base64').toString('utf8');
      const marker = 'id="blog-grid">';
      const idx    = html.indexOf(marker);
      if (idx !== -1) {
        const newCard = '\n      ' + generateBlogCard(a);
        html = html.slice(0, idx + marker.length) + newCard + html.slice(idx + marker.length);
        await ghPush('blog.html', html, `feat(blog): add card for "${a.title}"`, blogFile.sha);
      }
    }

    return res.status(200).json({
      success : true,
      slug    : a.slug,
      url     : `https://shininglegacy.ca/${a.slug}.html`,
      message : 'Article published — blog.html updated — Vercel will redeploy automatically'
    });

  } catch (err) {
    console.error('[webhook] error:', err);
    return res.status(500).json({ error: err.message });
  }
};
